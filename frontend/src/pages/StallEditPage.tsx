import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { stallApi } from '../api/stallApi';
import { ApiError, toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Stall } from '../types';
import { canEditStall } from '../utils/permissions';
import { StallForm } from '../components/StallForm';
import { ErrorState, Loading } from '../components/StatusViews';

export function StallEditPage() {
  const { id } = useParams();
  const stallId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stall, setStall] = useState<Stall | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    stallApi
      .getById(stallId)
      .then((data) => active && setStall(data))
      .catch((err) => active && setError(toApiError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [stallId]);

  if (loading) return <Loading text="Memuat data warung..." />;
  if (error) return <ErrorState error={error} />;
  if (!stall) return null;

  // Owner yang membuka warung milik owner lain lewat URL langsung -> ditolak di frontend.
  if (!canEditStall(user, stall)) {
    return (
      <div className="state state-error" role="alert">
        <div className="state-icon" aria-hidden="true">
          🔒
        </div>
        <h3>Akses ditolak (403)</h3>
        <p>Anda hanya boleh mengubah warung milik sendiri.</p>
        <div className="state-actions">
          <Link className="btn btn-ghost" to={`/stalls/${stall.id}`}>
            Lihat detail warung
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-narrow">
      <Link to={`/stalls/${stall.id}`} className="back-link">
        ← Kembali ke detail
      </Link>
      <h1>Ubah Warung</h1>
      <p className="muted">
        Perubahan dikirim ke <code>PUT /stalls/{stall.id}</code>.
      </p>
      <StallForm
        submitLabel="Simpan perubahan"
        initial={{
          name: stall.name,
          category: stall.category ?? '',
          location: stall.location ?? '',
          description: stall.description ?? '',
        }}
        onCancel={() => navigate(`/stalls/${stall.id}`)}
        onSubmit={async (input) => {
          const updated = await stallApi.update(stall.id, input);
          navigate(`/stalls/${updated.id}`, {
            replace: true,
            state: { flash: `Perubahan warung "${updated.name}" berhasil disimpan.` },
          });
        }}
      />
    </div>
  );
}
