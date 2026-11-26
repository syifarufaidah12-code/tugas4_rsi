import type { Request, Response } from 'express';
import { AuditLogService } from '../services/auditLogService.ts';
import { getValidated } from '../middlewares/validate.ts';
import type { ListAuditLogsQuery } from '../schemas/auditLogSchema.ts';
import { sendError } from '../utils/http.ts';

export class AuditLogController {
  private auditLogService: AuditLogService;

  constructor(auditLogService: AuditLogService = new AuditLogService()) {
    this.auditLogService = auditLogService;
  }

  // GET /audit-logs -> { status, data: { items, pagination } }
  getAuditLogs = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const query = getValidated<ListAuditLogsQuery>(res, 'query');
      const data = await this.auditLogService.list(query);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return sendError(res, error);
    }
  };

  // GET /audit-logs/:id -> { status, data } atau 404
  getAuditLogById = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = getValidated<{ id: number }>(res, 'params');
      const data = await this.auditLogService.getById(id);
      return res.status(200).json({ status: 'success', data });
    } catch (error) {
      return sendError(res, error);
    }
  };
}
