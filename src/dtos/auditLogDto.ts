/** Data yang ditulis backend ke AUDIT_LOGS. Tidak pernah berasal dari body request. */
export interface AuditRecord {
  userId: number;
  /** Konvensi <ACTION>_<ENTITY>, mis. CREATE_MENU, UPDATE_MENU; autentikasi: LOGIN, LOGOUT. */
  action: string;
  targetTable: string;
  targetId: number;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Bentuk satu item audit pada respons daftar dan detail. */
export interface AuditLogDto {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  action: string;
  targetTable: string;
  targetId: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date | string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
