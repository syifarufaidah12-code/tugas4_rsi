import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { auditApi, formatAuditTime } from '../api/auditApi';
import { ApiError, toApiError } from '../api/client';
import type { AuditLog, AuditLogQuery, AuditPagination } from '../types';
import { Pagination } from '../components/Pagination';
import { AuditDetailModal, actionTone } from '../components/AuditDetailModal';
import { EmptyState, ErrorState, Loading } from '../components/StatusViews';

const ACTIONS = ['LOGIN', 'LOGOUT', 'CREATE_MENU', 'UPDATE_MENU', 'DELETE_MENU'];
const TABLES = ['USERS', 'MENU_ITEMS'];
const PAGE_SIZES = [10, 20, 50];

type FilterForm = {
  action: string;
  targetTable: string;
  targetId: string;
  userId: string;
  from: string;
  to: string;
};

const EMPTY_FORM: FilterForm = { action: '', targetTable: '', targetId: '', userId: '', from: '', to: '' };

const isPositiveInt = (v: string) => /^[1-9]\d*$/.test(v);

export function AuditLogPage() {
  const [params, setParams] = useSearchParams();

  // Filter aktif disimpan di URL agar bisa di-refresh / dibagikan.
  const active: FilterForm = {
    action: params.get('action') ?? '',
    targetTable: params.get('targetTable') ?? '',
    targetId: params.get('targetId') ?? '',
    userId: params.get('userId') ?? '',
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
  };
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);
  const pageSize = PAGE_SIZES.includes(Number(params.get('pageSize')))
    ? Number(params.get('pageSize'))
    : 20;

  const [form, setForm] = useState<FilterForm>(active);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FilterForm, string>>>({});
  const [items, setItems] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<AuditPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);

  const queryKey = params.toString();

  // Form ikut berubah bila URL berubah (mis. tombol back).
  useEffect(() => {
    setForm(active);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  // GET /audit-logs setiap filter / halaman berubah.
  useEffect(() => {
    let alive = true;
    const query: AuditLogQuery = {
      page,
      pageSize,
      action: active.action || undefined,
      targetTable: active.targetTable || undefined,
      targetId: active.targetId ? Number(active.targetId) : undefined,
      userId: active.userId ? Number(active.userId) : undefined,
      from: active.from || undefined,
      to: active.to || undefined,
    };
    setLoading(true);
    setError(null);
    auditApi
      .list(query)
      .then((res) => {
        if (!alive) return;
        setItems(res.items);
        setPagination(res.pagination);
      })
      .catch((err) => alive && setError(toApiError(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, reloadKey]);

  const writeParams = (next: FilterForm, nextPage: number, nextSize = pageSize) => {
    const sp = new URLSearchParams();
    (Object.keys(next) as (keyof FilterForm)[]).forEach((k) => next[k] && sp.set(k, next[k]));
    if (nextPage > 1) sp.set('page', String(nextPage));
    if (nextSize !== 20) sp.set('pageSize', String(nextSize));
    setParams(sp);
  };

  const applyFilters = (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof FilterForm, string>> = {};
    if (form.targetId && !isPositiveInt(form.targetId)) errs.targetId = 'Harus bilangan bulat positif';
    if (form.userId && !isPositiveInt(form.userId)) errs.userId = 'Harus bilangan bulat positif';
    if (form.from && form.to && form.from > form.to) errs.to = 'Tanggal akhir sebelum tanggal awal';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;
    writeParams(form, 1);
  };

  const resetFilters = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    writeParams(EMPTY_FORM, 1);
  };

  const set = (key: keyof FilterForm) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => ({ ...e, [key]: undefined }));
  };

  const activeCount = Object.values(active).filter(Boolean).length;

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Audit Log</h1>
          <p className="muted">
            Riwayat aktivitas yang dicatat backend (append-only). Data diambil dari{' '}
            <code>GET /audit-logs</code> dan hanya dapat diakses admin.
          </p>
        </div>
      </section>

      <form className="card audit-filters" onSubmit={applyFilters} noValidate>
        <div className="audit-filter-grid">
          <div className="field">
            <label htmlFor="f-action">Action</label>
            <select id="f-action" value={form.action} onChange={(e) => set('action')(e.target.value)}>
              <option value="">Semua action</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-table">Target table</label>
            <select
              id="f-table"
              value={form.targetTable}
              onChange={(e) => set('targetTable')(e.target.value)}
            >
              <option value="">Semua tabel</option>
              {TABLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className={`field ${formErrors.targetId ? 'field-invalid' : ''}`}>
            <label htmlFor="f-target">Target ID</label>
            <input
              id="f-target"
              inputMode="numeric"
              placeholder="mis. 1"
              value={form.targetId}
              onChange={(e) => set('targetId')(e.target.value.trim())}
            />
            {formErrors.targetId && <span className="field-error">{formErrors.targetId}</span>}
          </div>
          <div className={`field ${formErrors.userId ? 'field-invalid' : ''}`}>
            <label htmlFor="f-user">User ID</label>
            <input
              id="f-user"
              inputMode="numeric"
              placeholder="mis. 2"
              value={form.userId}
              onChange={(e) => set('userId')(e.target.value.trim())}
            />
            {formErrors.userId && <span className="field-error">{formErrors.userId}</span>}
          </div>
          <div className="field">
            <label htmlFor="f-from">Dari tanggal</label>
            <input id="f-from" type="date" value={form.from} onChange={(e) => set('from')(e.target.value)} />
          </div>
          <div className={`field ${formErrors.to ? 'field-invalid' : ''}`}>
            <label htmlFor="f-to">Sampai tanggal</label>
            <input id="f-to" type="date" value={form.to} onChange={(e) => set('to')(e.target.value)} />
            {formErrors.to && <span className="field-error">{formErrors.to}</span>}
          </div>
        </div>
        <div className="audit-filter-actions">
          <span className="muted small">
            {activeCount > 0 ? `${activeCount} filter aktif` : 'Tanpa filter'}
          </span>
          <div className="audit-filter-buttons">
            <button type="button" className="btn btn-ghost" onClick={resetFilters}>
              Reset
            </button>
            <button type="submit" className="btn btn-primary">
              Terapkan filter
            </button>
          </div>
        </div>
      </form>

      {loading ? (
        <Loading text="Memuat audit log..." />
      ) : error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="🗂️"
          title="Tidak ada catatan audit"
          description={
            activeCount > 0
              ? 'Tidak ada catatan yang cocok dengan filter. Ubah atau reset filter.'
              : 'Belum ada aktivitas yang tercatat.'
          }
          action={
            activeCount > 0 && (
              <button className="btn btn-ghost" onClick={resetFilters}>
                Reset filter
              </button>
            )
          }
        />
      ) : (
        <>
          <div className="card table-wrap">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Waktu</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Result</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((log) => {
                  const result = log.metadata?.result;
                  return (
                    <tr key={log.id}>
                      <td className="mono">#{log.id}</td>
                      <td className="nowrap">{formatAuditTime(log.createdAt)}</td>
                      <td>
                        <div>{log.userName ?? '-'}</div>
                        <div className="small muted">
                          #{log.userId} · {log.userEmail ?? '-'}
                        </div>
                      </td>
                      <td>
                        <span className={`action-badge action-${actionTone(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="nowrap">
                        {log.targetTable} <span className="muted">#{log.targetId}</span>
                      </td>
                      <td>
                        {typeof result === 'string' ? (
                          <span className={`result-chip result-${result}`}>{result}</span>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetailId(log.id)}>
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pagination && (
            <div className="audit-pagination">
              <Pagination
                page={pagination.page}
                limit={pagination.pageSize}
                total={pagination.total}
                itemLabel="catatan"
                onChange={(p) => writeParams(active, p)}
              />
              <label className="page-size">
                Per halaman
                <select
                  value={pageSize}
                  onChange={(e) => writeParams(active, 1, Number(e.target.value))}
                >
                  {PAGE_SIZES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </>
      )}

      <AuditDetailModal id={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
