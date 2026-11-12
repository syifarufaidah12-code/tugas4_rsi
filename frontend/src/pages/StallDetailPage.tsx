import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { stallApi } from '../api/stallApi';
import { ApiError, toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Stall } from '../types';
import { canDeleteStall, canEditStall } from '../utils/permissions';
import { Rating } from '../components/Rating';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Alert, ErrorState, Loading } from '../components/StatusViews';

export function StallDetailPage() {
  const { id } = useParams();
  const stallId = Number(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [flash, setFlash] = useState<string | null>(
    (location.state as { flash?: string } | null)?.flash ?? null,
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // GET /stalls/:id
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    stallApi
      .getById(stallId)
      .then((data) => active && setStall(data))
      .catch((err) => active && setError(toApiError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [stallId, reloadKey]);

  const handleDelete = async () => {
    if (!stall) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await stallApi.remove(stall.id);
      navigate('/', { state: { flash: `Warung "${stall.name}" berhasil dihapus dari database.` } });
    } catch (err) {
      const e = toApiError(err);
      setDeleteError(e.status > 0 ? `${e.message} (HTTP ${e.status})` : e.message);
      setDeleting(false);
    }
  };

  if (loading) return <Loading text="Memuat detail warung..." />;
  if (error)
    return (
      <ErrorState
        error={error}
        title={error.isNotFound ? 'Warung tidak ditemukan' : undefined}
        onRetry={error.isNotFound ? undefined : () => setReloadKey((k) => k + 1)}
      />
    );
  if (!stall) return null;

  const isMine = user?.role === 'owner' && stall.ownerId === user.id;

  return (
    <div className="page">
      <Link to="/" className="back-link">
        ← Kembali ke daftar
      </Link>

      {flash && (
        <Alert type="success" onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <article className="card detail">
        <header className="detail-header">
          <div>
            <div className="stall-badges">
              <span className="chip">{stall.category || 'Tanpa kategori'}</span>
              {stall.isPopular && <span className="chip chip-popular">🔥 Populer</span>}
              {isMine && <span className="chip chip-mine">Milik Anda</span>}
            </div>
            <h1>{stall.name}</h1>
            <p className="muted">📍 {stall.location || 'Lokasi belum diisi'}</p>
          </div>
          <div className="detail-actions">
            {canEditStall(user, stall) && (
              <Link className="btn btn-secondary" to={`/stalls/${stall.id}/edit`}>
                Ubah warung
              </Link>
            )}
            {canDeleteStall(user) && (
              <button
                className="btn btn-danger"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
              >
                Hapus
              </button>
            )}
          </div>
        </header>

        <section className="detail-section">
          <h2>Deskripsi</h2>
          <p>{stall.description || 'Belum ada deskripsi.'}</p>
        </section>

        <dl className="detail-grid">
          <div>
            <dt>ID Warung</dt>
            <dd>#{stall.id}</dd>
          </div>
          <div>
            <dt>ID Pemilik</dt>
            <dd>#{stall.ownerId}</dd>
          </div>
          <div>
            <dt>Rating rata-rata</dt>
            <dd>
              <Rating value={stall.avgRating} count={stall.reviewCount} />
            </dd>
          </div>
          <div>
            <dt>Jumlah review</dt>
            <dd>{stall.reviewCount} review</dd>
          </div>
        </dl>

        {user?.role === 'owner' && !isMine && (
          <Alert type="info">
            Warung ini milik owner lain. Sesuai aturan backend, Anda tidak dapat mengubahnya.
          </Alert>
        )}
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus warung?"
        loading={deleting}
        error={deleteError}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      >
        <p>
          Warung <strong>{stall.name}</strong> beserta menu dan review-nya akan dihapus permanen
          dari database.
        </p>
      </ConfirmDialog>
    </div>
  );
}
