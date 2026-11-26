import { Router } from 'express';
import { AuditLogController } from '../controllers/auditLogController.ts';
import { authenticate, authorize } from '../middlewares/auth.ts';
import { validate } from '../middlewares/validate.ts';
import { auditLogIdParamsSchema, listAuditLogsQuerySchema } from '../schemas/auditLogSchema.ts';

const auditLogRouter = Router();
const auditLogController = new AuditLogController();

// Seluruh endpoint audit: wajib login (401) dan hanya admin (403).
// Tidak ada POST/PUT/DELETE: audit hanya ditulis oleh backend dan bersifat append-only.
auditLogRouter.use(authenticate, authorize('admin'));

auditLogRouter.get('/', validate(listAuditLogsQuerySchema, 'query'), (req, res) => {
  // #swagger.tags = ['Audit Logs']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['page']        = { in: 'query', type: 'integer' }
  // #swagger.parameters['pageSize']    = { in: 'query', type: 'integer' }
  // #swagger.parameters['action']      = { in: 'query', type: 'string' }
  // #swagger.parameters['targetTable'] = { in: 'query', type: 'string' }
  // #swagger.parameters['targetId']    = { in: 'query', type: 'integer' }
  // #swagger.parameters['userId']      = { in: 'query', type: 'integer' }
  // #swagger.parameters['from']        = { in: 'query', type: 'string', description: 'YYYY-MM-DD' }
  // #swagger.parameters['to']          = { in: 'query', type: 'string', description: 'YYYY-MM-DD' }
  // #swagger.responses[200] = { description: 'Daftar audit log { items, pagination }' }
  // #swagger.responses[400] = { description: 'Validasi query gagal' }
  // #swagger.responses[401] = { description: 'Token tidak ada / tidak valid' }
  // #swagger.responses[403] = { description: 'Bukan admin' }
  return auditLogController.getAuditLogs(req, res);
});

auditLogRouter.get('/:id', validate(auditLogIdParamsSchema, 'params'), (req, res) => {
  // #swagger.tags = ['Audit Logs']
  // #swagger.security = [{ "bearerAuth": [] }]
  // #swagger.parameters['id'] = { in: 'path', required: true, type: 'integer' }
  // #swagger.responses[200] = { description: 'Detail satu audit log' }
  // #swagger.responses[404] = { description: 'Tidak ditemukan' }
  return auditLogController.getAuditLogById(req, res);
});

export { auditLogRouter };
