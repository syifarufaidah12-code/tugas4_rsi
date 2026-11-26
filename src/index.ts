import express, { type Request, type Response, type Application } from 'express';
import { sql } from 'drizzle-orm';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './docs/swagger-output.json' with { type: 'json' };
import { getDb } from './db/index.ts';
import { authRouter } from './routes/authRouter.ts';
import { stallRouter } from './routes/stallRouter.ts';
import { userRouter } from './routes/userRouter.ts';
import { menuItemRouter } from './routes/menuItemRouter.ts';
import { reviewRouter } from './routes/reviewRouter.ts';
import { likeRouter } from './routes/likeRouter.ts';
import { flagRouter } from './routes/flagRouter.ts';
import { auditLogRouter } from './routes/auditLogRouter.ts';
import { errorHandler, notFound } from './middlewares/errorHandler.ts';
import { cors } from './middlewares/cors.ts';

const app: Application = express();
const PORT: number = Number(process.env.PORT ?? 3000);

const swaggerSpec = {
  ...swaggerDocument,
  paths: {
    ...swaggerDocument.paths,
    '/api/audit-logs': {
      get: {
        tags: ['Audit Logs'],
        description: 'Daftar audit log (khusus admin)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer' } },
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'targetTable', in: 'query', schema: { type: 'string' } },
          { name: 'targetId', in: 'query', schema: { type: 'integer' } },
          { name: 'userId', in: 'query', schema: { type: 'integer' } },
          { name: 'from', in: 'query', description: 'YYYY-MM-DD', schema: { type: 'string' } },
          { name: 'to', in: 'query', description: 'YYYY-MM-DD', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Daftar audit log { items, pagination }' },
          '400': { description: 'Validasi query gagal' },
          '401': { description: 'Token tidak ada / tidak valid' },
          '403': { description: 'Bukan admin' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
    '/api/audit-logs/{id}': {
      get: {
        tags: ['Audit Logs'],
        description: 'Detail satu audit log (khusus admin)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Detail satu audit log' },
          '400': { description: 'ID tidak valid' },
          '401': { description: 'Token tidak ada / tidak valid' },
          '403': { description: 'Bukan admin' },
          '404': { description: 'Data audit log tidak ditemukan' },
        },
        security: [{ bearerAuth: [] }],
      },
    },
  },
};

// CORS dipasang paling awal agar frontend React (origin berbeda) bisa memanggil API.
app.use(cors);
app.use(express.json());
// Dokumentasi API (Swagger UI)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    await db.execute(sql`SELECT 1 AS ok`);
    res.status(200).json({ status: 'success', message: 'Server dan database terhubung' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Gagal terhubung ke database',
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/stalls', stallRouter);
app.use('/api/v1/menu-items', menuItemRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/likes', likeRouter);
app.use('/api/v1/flags', flagRouter);
// Audit log: tersedia di /api/v1/audit-logs (prefix proyek) dan /api/audit-logs (sesuai soal Tugas 5).
app.use('/api/v1/audit-logs', auditLogRouter);
app.use('/api/audit-logs', auditLogRouter);

// Dua baris ini harus paling bawah, setelah semua route.
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});