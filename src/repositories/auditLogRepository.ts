import { and, count, desc, eq, sql, type SQL } from 'drizzle-orm';
import { getDb, type DbExecutor } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';
import type { AuditRecord } from '../dtos/auditLogDto.ts';

export interface AuditLogFilters {
  page: number;
  pageSize: number;
  action?: string;
  targetTable?: string;
  targetId?: number;
  userId?: number;
  /** YYYY-MM-DD, batas awal hari (inklusif). */
  from?: string;
  /** YYYY-MM-DD, batas akhir hari (inklusif). */
  to?: string;
}

// userName & userEmail tidak disimpan di AUDIT_LOGS: diambil dari USERS lewat JOIN saat dibaca.
const auditWithUser = {
  id: auditLogs.id,
  userId: auditLogs.userId,
  action: auditLogs.action,
  targetTable: auditLogs.targetTable,
  targetId: auditLogs.targetId,
  metadata: auditLogs.metadata,
  ipAddress: auditLogs.ipAddress,
  userAgent: auditLogs.userAgent,
  createdAt: auditLogs.createdAt,
  userName: users.name,
  userEmail: users.email,
};

export class AuditLogRepository {
  /**
   * INSERT satu catatan audit. Bisa memakai transaksi (`executor`) supaya
   * audit tersimpan/batal bersama mutasi datanya.
   * Sengaja tanpa OUTPUT: tabel ini punya trigger, dan audit tidak perlu dibaca balik.
   */
  async insert(record: AuditRecord, executor?: DbExecutor): Promise<void> {
    const db = executor ?? (await getDb());
    await db.insert(auditLogs).values({
      userId: record.userId,
      action: record.action,
      targetTable: record.targetTable,
      targetId: record.targetId,
      metadata: record.metadata ? JSON.stringify(record.metadata) : null,
      ipAddress: record.ipAddress ?? null,
      userAgent: record.userAgent ?? null,
    });
  }

  private buildWhere(f: AuditLogFilters): SQL | undefined {
    // Semua filter digabung dengan AND. Nilai dikirim sebagai parameter oleh Drizzle.
    const conditions: SQL[] = [];
    if (f.action !== undefined) conditions.push(eq(auditLogs.action, f.action));
    if (f.targetTable !== undefined) conditions.push(eq(auditLogs.targetTable, f.targetTable));
    if (f.targetId !== undefined) conditions.push(eq(auditLogs.targetId, f.targetId));
    if (f.userId !== undefined) conditions.push(eq(auditLogs.userId, f.userId));
    // Tanggal dibandingkan di SQL Server (zona waktu yang sama dengan created_at).
    // from: >= awal hari; to: < awal hari berikutnya  => seluruh hari `to` ikut (inklusif).
    if (f.from !== undefined) {
      conditions.push(sql`${auditLogs.createdAt} >= CAST(${f.from} AS DATE)`);
    }
    if (f.to !== undefined) {
      conditions.push(sql`${auditLogs.createdAt} < DATEADD(DAY, 1, CAST(${f.to} AS DATE))`);
    }
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  async findAll(filters: AuditLogFilters) {
    const db = await getDb();
    const where = this.buildWhere(filters);
    const offset = (filters.page - 1) * filters.pageSize;

    // Pagination di database: ORDER BY + OFFSET ... FETCH NEXT.
    const rows = await db
      .select(auditWithUser)
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(where)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .offset(offset)
      .fetch(filters.pageSize);

    // Total dihitung dari baris yang lolos filter, bukan seluruh tabel.
    const totals = await db.select({ total: count() }).from(auditLogs).where(where);
    return { rows, total: Number(totals[0]?.total ?? 0) };
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select(auditWithUser)
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(eq(auditLogs.id, id));
    return rows[0];
  }
}
