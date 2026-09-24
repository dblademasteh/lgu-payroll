import { prisma } from '../lib/prisma.js';
import { redact } from '../lib/secrets.js';

export async function auditMiddleware(req, res, next) {
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  if (!mutating) return next();

  const originalJson = res.json.bind(res);
  let responseBody = null;
  let statusCode = 200;

  res.json = (body) => {
    responseBody = body;
    statusCode = res.statusCode;
    return originalJson(body);
  };

  const before = req.body ? redact({ ...req.body }) : null;
  const ip = req.ip;

  res.on('finish', async () => {
    try {
      const userId = req.user?.id ?? req.apiKey?.id ?? null;
      const after = responseBody ? redact(responseBody) : null;
      await prisma.auditLog.create({
        data: {
          userId,
          action: `${req.method} ${req.originalUrl}`,
          entity: req.baseUrl.split('/').filter(Boolean).join('/') || 'root',
          entityId: req.params.id ?? 'bulk',
          before,
          after,
          ip,
          error: statusCode >= 400,
        },
      });
    } catch (e) {
      console.error('[audit] Failed to write audit log:', e);
    }
  });

  next();
}