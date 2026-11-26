import { useEffect, useState } from 'react';
import { auditApi, formatAuditTime } from '../api/auditApi';
import { ApiError, toApiError } from '../api/client';
import type { AuditLog } from '../types';

interface Props {
  id: number | null;
  onClose: () => void;
}

/** Modal detail: memanggil GET /audit-logs/:id lalu menampilkan metadata, ip_address, user_agent. */
export function AuditDetailModal({ id, onClose }: Props) {
  const [log, setLog] = useState<AuditLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (id === null) return;
    let active = true;
    setLoading(true);
    setError(null);
    setLog(null);
    auditApi
      .getById(id)
      .then((data) => active && setLog(data))
      .catch((err) => active && setError(toApiError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (id === null) return null;

  const meta = log?.metadata ?? {};
  const ip = typeof meta.ip_address === 'string' ? meta.ip_address : null;
  const ua = typeof meta.user_agent === 'string' ? meta.user_agent : null;
  // Sisa metadata (selain ip & user agent) ditampilkan sebagai JSON.
  const rest = Object.fromEntries(
    Object.entries(meta).filter(([k]) => k !== 'ip_address' && k !== 'user_agent'),
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="audit-detail-title">Detail Audit #{id}</h3>
          <button className="alert-close" onClick={onClose} aria-label="Tutup">
            ×
          </button>
        </div>

        {loading && (
          <div className="modal-loading">
            <span className="spinner spinner-sm" aria-hidden="true" /> Memuat GET /audit-logs/{id}...
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error.isNotFound ? 'Catatan audit tidak ditemukan.' : error.message}
            {error.status > 0 && ` (HTTP ${error.status})`}
          </div>
        )}

        {log && (
          <>
            <dl className="detail-grid audit-detail-grid">
              <div>
                <dt>Action</dt>
                <dd>
                  <span className={`action-badge action-${actionTone(log.action)}`}>{log.action}</span>
                </dd>
              </div>
              <div>
                <dt>Waktu</dt>
                <dd>{formatAuditTime(log.createdAt)}</dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>
                  {log.userName ?? '-'} <span className="muted">#{log.userId}</span>
                  <div className="small muted">{log.userEmail ?? '-'}</div>
                </dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>
                  {log.targetTable} <span className="muted">#{log.targetId}</span>
                </dd>
              </div>
              <div>
                <dt>IP address</dt>
                <dd>{ip ?? <span className="muted">tidak dicatat</span>}</dd>
              </div>
              <div className="span-2">
                <dt>User agent</dt>
                <dd className="break">{ua ?? <span className="muted">tidak dicatat</span>}</dd>
              </div>
            </dl>

            <h4 className="modal-subtitle">Metadata</h4>
            <pre className="json-view">{JSON.stringify(rest, null, 2)}</pre>
          </>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export function actionTone(action: string): string {
  if (action === 'LOGIN' || action === 'LOGOUT') return 'auth';
  if (action.startsWith('CREATE_')) return 'create';
  if (action.startsWith('UPDATE_')) return 'update';
  if (action.startsWith('DELETE_')) return 'delete';
  return 'other';
}
