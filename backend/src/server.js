import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { prisma } from './lib/prisma.js';
import { AppError } from './lib/errors.js';

const app = express();

const trustProxy = process.env.TRUST_PROXY;
if (trustProxy) app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy.split(',').map((s) => s.trim()).filter(Boolean));

app.use(helmet());
const allowedOrigins = [process.env.WEB_ORIGIN, 'http://localhost:5176', 'http://localhost:5177'].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS: origin not allowed'));
  },
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use('/api/', apiLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => { console.log('req', req.path); next(); });
}

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'lgu-payroll-backend' });
});

app.use('/api/v1', routes);

function normalizePrismaError(err) {
  if (err instanceof AppError) return err;
  const code = err?.code;
  if (typeof code === 'string' && /^P2\d{3}$/.test(code)) {
    switch (code) {
      case 'P2002': return new AppError('A record with that unique value already exists', 409, 'DUPLICATE');
      case 'P2003': return new AppError('Referenced record does not exist', 400, 'VALIDATION_ERROR');
      case 'P2025': return new AppError('Record not found', 404, 'NOT_FOUND');
      case 'P2000': return new AppError('Value too long for the field', 400, 'VALIDATION_ERROR');
      default: return new AppError('Database validation failed', 400, 'VALIDATION_ERROR');
    }
  }
  return err;
}

app.use((err, req, res, next) => {
  const normalized = normalizePrismaError(err);
  const status = normalized.status || 500;
  const code = normalized.code || 'INTERNAL_ERROR';
  const message = status >= 500 ? 'Something went wrong' : normalized.message;
  if (status >= 500) {
    console.error(normalized);
  }
  res.status(status).json({ error: { code, message } });
});

const PORT = process.env.PORT || 4101;
const server = app.listen(PORT, () => {
  console.log(`LGU Payroll Backend running on http://localhost:${PORT}`);

  if (process.env.NODE_ENV === 'production' || process.env.RUN_MIGRATIONS_ON_STARTUP === 'true') {
    (async () => {
      try {
        const { execFile } = await import('child_process');
        const { promisify } = await import('util');
        const execFileAsync = promisify(execFile);
        console.log('[startup] Running prisma migrate deploy...');
        await execFileAsync('npx', ['prisma', 'migrate', 'deploy'], { cwd: process.cwd(), timeout: 120000 });
        console.log('[startup] Migrations applied successfully');
      } catch (e) {
        console.error('[startup] Migration failed:', e);
        if (process.env.NODE_ENV === 'production') process.exit(1);
      }
    })();
  }
});

const shutdown = (signal) => {
  console.log(`\n${signal} received: shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed');
    try {
      await prisma.$disconnect();
      console.log('Prisma client disconnected');
    } catch (e) {
      console.error('Error during disconnect:', e);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));