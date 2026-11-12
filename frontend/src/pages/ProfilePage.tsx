import { useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { ApiError, toApiError } from '../api/client';
import type { User } from '../types';
import { ROLE_ACCESS, ROLE_LABEL } from '../utils/permissions';
import { ErrorState, Loading } from '../components/StatusViews';

/** Menampilkan informasi user yang sedang login langsung dari GET /auth/me. */
export function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    authApi
      .me()
      .then((user) => {
        if (!active) return;
        setMe(user);
        setFetchedAt(new Date());
      })
      .catch((err) => active && setError(toApiError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadKey]);

  if (loading) return <Loading text="Mengambil data GET /auth/me..." />;
  if (error) return <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />;
  if (!me) return null;

  return (
    <div className="page page-narrow">
      <h1>Profil Saya</h1>
      <p className="muted">
        Data berikut diambil dari <code>GET /auth/me</code> menggunakan token JWT yang tersimpan.
      </p>

      <div className="card profile">
        <div className="profile-head">
          <span className="avatar avatar-lg" aria-hidden="true">
            {me.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <h2>{me.name}</h2>
            <span className={`role-badge role-${me.role}`}>{ROLE_LABEL[me.role]}</span>
          </div>
        </div>

        <dl className="detail-grid">
          <div>
            <dt>ID User</dt>
            <dd>#{me.id}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{me.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{me.role}</dd>
          </div>
          <div>
            <dt>Hak akses</dt>
            <dd>{ROLE_ACCESS[me.role]}</dd>
          </div>
        </dl>

        <div className="profile-foot">
          <span className="muted">
            Diambil pukul {fetchedAt?.toLocaleTimeString('id-ID')}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setReloadKey((k) => k + 1)}>
            Muat ulang dari server
          </button>
        </div>
      </div>
    </div>
  );
}
