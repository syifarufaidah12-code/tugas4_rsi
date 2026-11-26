import { AuditLogRepository, type AuditLogFilters } from '../repositories/auditLogRepository.ts';
import type { AuditLogDto, AuditRecord, Pagination } from '../dtos/auditLogDto.ts';
import type { DbExecutor } from '../db/index.ts';
import { AppError } from '../utils/http.ts';

type AuditRow = NonNullable<Awaited<ReturnType<AuditLogRepository['findById']>>>;

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : { value };
  } catch {
    return { raw };
  }
}

export class AuditLogService {
  private auditLogRepository: AuditLogRepository;

  constructor(auditLogRepository: AuditLogRepository = new AuditLogRepository()) {
    this.auditLogRepository = auditLogRepository;
  }

  // ip_address & user_agent disimpan di kolom sendiri, lalu digabung ke metadata pada respons.
  private toDto(row: AuditRow): AuditLogDto {
    const metadata = parseMetadata(row.metadata);
    if (row.ipAddress !== null) metadata.ip_address = row.ipAddress;
    if (row.userAgent !== null) metadata.user_agent = row.userAgent;
    return {
      id: row.id,
      userId: row.userId,
      userName: row.userName,
      userEmail: row.userEmail,
      action: row.action,
      targetTable: row.targetTable,
      targetId: row.targetId,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      createdAt: row.createdAt,
    };
  }

  async list(filters: AuditLogFilters): Promise<{ items: AuditLogDto[]; pagination: Pagination }> {
    const { rows, total } = await this.auditLogRepository.findAll(filters);
    return {
      items: rows.map((row) => this.toDto(row)),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total,
        totalPages: Math.ceil(total / filters.pageSize),
      },
    };
  }

  async getById(id: number): Promise<AuditLogDto> {
    const row = await this.auditLogRepository.findById(id);
    if (!row) throw new AppError(404, 'Data audit log tidak ditemukan');
    return this.toDto(row);
  }

  /** Audit untuk mutasi data: WAJIB dipanggil dengan transaksi yang sama (tx). */
  record(record: AuditRecord, tx: DbExecutor): Promise<void> {
    return this.auditLogRepository.insert(record, tx);
  }

  /**
   * Audit LOGIN / LOGOUT (best-effort): kegagalan menulis audit hanya dicatat
   * di console dan TIDAK menggagalkan proses autentikasi.
   */
  async recordBestEffort(record: AuditRecord): Promise<boolean> {
    try {
      await this.auditLogRepository.insert(record);
      return true;
    } catch (error) {
      console.error(
        `[audit] gagal menulis ${record.action} untuk user ${record.userId}:`,
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  }
}
