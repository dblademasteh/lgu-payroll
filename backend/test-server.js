import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'lgu-payroll-backend' });
});

const PORT = process.env.PORT || 4101;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`LGU Payroll Backend running on http://localhost:${PORT}`);
  
  // Test the server is responding
  setTimeout(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/api/v1/health`);
      const data = await response.json();
      console.log('Health check response:', data);
    } catch (e) {
      console.error('Health check failed:', e.message);
    }
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  }, 1000);
});

server.on('error', (e) => {
  console.error('Server error:', e);
  process.exit(1);
});

process.on('unhandledRejection', (r) => console.error('Unhandled rejection:', r));
process.on('uncaughtException', (e) => console.error('Uncaught exception:', e));