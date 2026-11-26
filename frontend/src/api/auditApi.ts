import { api } from './client';
import type { ApiSuccess, AuditLog, AuditLogQuery, AuditPagination } from '../types';

/** Buang filter kosong supaya tidak dikirim sebagai parameter (backend menolak nilai tidak valid). */
function clean(query: AuditLogQuery): Partial<AuditLogQuery> {
  return Object.fromEntries(
    Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ) as Partial<AuditLogQuery>;
}

export const auditApi = {
  /** GET /audit-logs?page=&pageSize=&action=&targetTable=&targetId=&userId=&from=&to= (admin). */
  async list(query: AuditLogQuery): Promise<{ items: AuditLog[]; pagination: AuditPagination }> {
    const res = await api.get<ApiSuccess<{ items: AuditLog[]; pagination: AuditPagination }>>(
      '/audit-logs',
      { params: clean(query) },
    );
    return res.data.data;
  },

  /** GET /audit-logs/:id (admin). 404 bila catatan tidak ada. */
  async getById(id: number): Promise<AuditLog> {
    const res = await api.get<ApiSuccess<AuditLog>>(`/audit-logs/${id}`);
    return res.data.data;
  },
};

// created_at disimpan SQL Server sebagai waktu lokal server; tampilkan apa adanya (tanpa geser zona).
export function formatAuditTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('id-ID', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
