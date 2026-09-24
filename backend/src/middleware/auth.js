import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../lib/errors.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET must be set');

const ACCESS_TTL_INT = 15 * 60; // 15m
const REFRESH_TTL_INT = 7 * 24 * 60 * 60; // 7d

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, tver: user.tokenVersion ?? 0 },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL_INT }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role, typ: 'refresh', tver: user.tokenVersion ?? 0 },
    JWT_SECRET,
    { expiresIn: REFRESH_TTL_INT }
  );
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    throw new AppError('Invalid or expired access token', 401, 'UNAUTHORIZED');
  }
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.typ !== 'refresh') throw new Error('Not a refresh token');
    return payload;
  } catch (e) {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }
}

export async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    throw new AppError('Missing or invalid Authorization header', 401, 'UNAUTHORIZED');
  }
  const token = auth.slice(7);
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError('User not found or inactive', 401, 'UNAUTHORIZED');
  }
  if (user.tokenVersion !== (payload.tver ?? 0)) {
    throw new AppError('Session invalidated — please sign in again', 401, 'SESSION_REVOKED');
  }
  req.user = { id: user.id, username: user.username, fullName: user.fullName, role: user.role, externalId: user.externalId };
  next();
}

export function requireApiKey(requiredScopes = []) {
  return async (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      throw new AppError('Missing or invalid Authorization header', 401, 'UNAUTHORIZED');
    }
    const rawKey = auth.slice(7);
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash } });
    if (!apiKey || !apiKey.active) {
      throw new AppError('Invalid or revoked API key', 401, 'UNAUTHORIZED');
    }
    if (requiredScopes.length && !requiredScopes.every((s) => apiKey.scopes.includes(s))) {
      throw new AppError('Insufficient scope', 403, 'FORBIDDEN');
    }
    await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
    req.apiKey = { id: apiKey.id, name: apiKey.name, scopes: apiKey.scopes };
    next();
  };
}

import crypto from 'crypto';