import { Link } from 'react-router-dom';
import type { Stall, User } from '../types';
import { canDeleteStall, canEditStall } from '../utils/permissions';
import { Rating } from './Rating';

interface Props {
  stall: Stall;
  user: User | null;
  onDelete: (stall: Stall) => void;
}

export function StallCard({ stall, user, onDelete }: Props) {
  const isMine = user?.role === 'owner' && stall.ownerId === user.id;

  return (
    <article className="card stall-card">
      <div className="stall-card-top">
        <span className="chip">{stall.category || 'Tanpa kategori'}</span>
        <div className="stall-badges">
          {isMine && <span className="chip chip-mine">Milik Anda</span>}
          {stall.isPopular && <span className="chip chip-popular">🔥 Populer</span>}
        </div>
      </div>

      <h3 className="stall-card-title">
        <Link to={`/stalls/${stall.id}`}>{stall.name}</Link>
      </h3>
      <p className="stall-card-location">📍 {stall.location || 'Lokasi belum diisi'}</p>
      <p className="stall-card-desc">{stall.description || 'Belum ada deskripsi.'}</p>

      <div className="stall-card-footer">
        <Rating value={stall.avgRating} count={stall.reviewCount} />
        <div className="stall-card-actions">
          <Link className="btn btn-ghost btn-sm" to={`/stalls/${stall.id}`}>
            Detail
          </Link>
          {canEditStall(user, stall) && (
            <Link className="btn btn-secondary btn-sm" to={`/stalls/${stall.id}/edit`}>
              Ubah
            </Link>
          )}
          {canDeleteStall(user) && (
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(stall)}>
              Hapus
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
