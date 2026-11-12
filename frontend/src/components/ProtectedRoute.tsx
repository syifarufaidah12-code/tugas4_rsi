import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';
import { ROLE_LABEL } from '../utils/permissions';
import { Loading } from './StatusViews';

/**
 * Pelindung halaman:
 * - belum login  -> diarahkan ke /login (setara 401)
 * - role salah   -> tampil pesan akses ditolak (setara 403)
 */
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <Loading text="Memeriksa sesi login..." />;

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          flash: 'Silakan login terlebih dahulu untuk mengakses halaman tersebut.',
        }}
      />
    );
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="state state-error" role="alert">
        <div className="state-icon" aria-hidden="true">
          🔒
        </div>
        <h3>Akses ditolak (403)</h3>
        <p>
          Halaman ini hanya untuk role {roles.map((r) => ROLE_LABEL[r]).join(' / ')}. Anda login
          sebagai <strong>{ROLE_LABEL[user.role]}</strong>.
        </p>
        <div className="state-actions">
          <Link className="btn btn-ghost" to="/">
            Kembali ke daftar warung
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
