import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { ApiError } from '../api/client';

/** Loading state: spinner + teks. */
export function Loading({ text = 'Memuat data...' }: { text?: string }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

/** Skeleton kartu untuk daftar warung saat loading. */
export function StallSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="stall-grid" role="status" aria-label="Memuat daftar warung">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card skeleton-card" key={i}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

/** Empty state: data kosong / hasil pencarian kosong. */
export function EmptyState({
  title,
  description,
  action,
  icon = '🍽️',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="state state-empty">
      <div className="state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

/** Error state: request gagal, menampilkan status code dan pesan backend. */
export function ErrorState({
  error,
  onRetry,
  title,
}: {
  error: ApiError;
  onRetry?: () => void;
  title?: string;
}) {
  const heading =
    title ??
    (error.isNetwork
      ? 'Server tidak dapat dihubungi'
      : error.isNotFound
        ? 'Data tidak ditemukan'
        : error.isUnauthorized
          ? 'Perlu login (401)'
          : error.isForbidden
            ? 'Akses ditolak (403)'
            : 'Gagal memuat data');

  return (
    <div className="state state-error" role="alert">
      <div className="state-icon" aria-hidden="true">
        {error.isNotFound ? '🔍' : error.isForbidden || error.isUnauthorized ? '🔒' : '⚠️'}
      </div>
      <h3>{heading}</h3>
      <p>{error.message}</p>
      {error.status > 0 && <code className="status-code">HTTP {error.status}</code>}
      <div className="state-actions">
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry}>
            Coba lagi
          </button>
        )}
        {error.isUnauthorized && (
          <Link className="btn btn-primary" to="/login">
            Login
          </Link>
        )}
        <Link className="btn btn-ghost" to="/">
          Kembali ke daftar warung
        </Link>
      </div>
    </div>
  );
}

/** Alert kecil untuk feedback sukses/gagal. */
export function Alert({
  type,
  children,
  onClose,
}: {
  type: 'success' | 'error' | 'info' | 'warning';
  children: ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <div className="alert-body">{children}</div>
      {onClose && (
        <button className="alert-close" onClick={onClose} aria-label="Tutup">
          ×
        </button>
      )}
    </div>
  );
}
