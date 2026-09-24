import express from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken, requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { loginSchema, refreshSchema, changePasswordSchema } from '../shared/contracts/auth.js';
import { AppError } from '../lib/errors.js';

const router = express.Router();

router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }
    if (user.status !== 'ACTIVE') {
      throw new AppError('Account is inactive', 403, 'INACTIVE_ACCOUNT');
    }
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.json({
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, externalId: user.externalId },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');
    }
    if (user.tokenVersion !== (payload.tver ?? 0)) {
      throw new AppError('Session invalidated — please sign in again', 401, 'SESSION_REVOKED');
    }
    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) {
    next(e);
  }
});

router.post('/change-password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    res.json({ message: 'Password updated successfully' });
  } catch (e) {
    next(e);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    res.json({
      user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, externalId: user.externalId },
      accessToken,
      refreshToken,
    });
  } catch (e) {
    next(e);
  }
});

export default router;