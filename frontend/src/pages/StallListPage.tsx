import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { stallApi } from '../api/stallApi';
import { ApiError, toApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ListMeta, Stall } from '../types';
import { canCreateStall, ROLE_ACCESS, ROLE_LABEL } from '../utils/permissions';
import { StallCard } from '../components/StallCard';
import { Pagination } from '../components/Pagination';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CATEGORY_SUGGESTIONS } from '../components/StallForm';
import { Alert, EmptyState, ErrorState, StallSkeletonGrid } from '../components/StatusViews';

const PAGE_SIZE = 6;

export function StallListPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // Filter disimpan di URL (?search=&category=&page=) agar bisa di-bookmark / di-refresh.
  const search = params.get('search') ?? '';
  const category = params.get('category') ?? '';
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [meta, setMeta] = useState<ListMeta>({ page: 1, limit: PAGE_SIZE, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [flash, setFlash] = useState<string | null>(
    (location.state as { flash?: string } | null)?.flash ?? null,
  );
  const [toDelete, setToDelete] = useState<Stall | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Hapus flash message dari history agar tidak muncul lagi saat refresh.
  useEffect(() => {
    if ((location.state as { flash?: string } | null)?.flash) {
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateParams = useCallback(
    (next: { search?: string; category?: string; page?: number }) => {
      const merged = { search, category, page, ...next };
      const sp = new URLSearchParams();
      if (merged.search) sp.set('search', merged.search);
      if (merged.category) sp.set('category', merged.category);
      if (merged.page && merged.page > 1) sp.set('page', String(merged.page));
      setParams(sp);
    },
    [search, category, page, setParams],
  );

  // Debounce pencarian 400 ms.
  useEffect(() => {
    if (searchInput.trim() === search) return;
    const t = setTimeout(() => updateParams({ search: searchInput.trim(), page: 1 }), 400);
    return () => clearTimeout(t);
  }, [searchInput, search, updateParams]);

  // GET /stalls setiap filter / halaman berubah.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    stallApi
      .list({ search, category, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setStalls(res.data);
        setMeta(res.meta);
      })
      .catch((err) => active && setError(toApiError(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [search, category, page, reloadKey]);

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await stallApi.remove(toDelete.id);
      setFlash(`Warung "${toDelete.name}" berhasil dihapus dari database.`);
      setToDelete(null);
      // Jika item terakhir di halaman terhapus, mundur satu halaman.
      if (stalls.length === 1 && page > 1) updateParams({ page: page - 1 });
      else setReloadKey((k) => k + 1);
    } catch (err) {
      const e = toApiError(err);
      setDeleteError(e.status > 0 ? `${e.message} (HTTP ${e.status})` : e.message);
    } finally {
      setDeleting(false);
    }
  };

  const hasFilter = Boolean(search || category);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>Daftar Warung Kantin</h1>
          <p className="muted">
            Temukan warung favoritmu di lingkungan kampus. Data diambil langsung dari backend
            melalui <code>GET /stalls</code>.
          </p>
        </div>
        {canCreateStall(user) && (
          <Link to="/stalls/new" className="btn btn-primary">
            + Tambah Warung
          </Link>
        )}
      </section>

      {user ? (
        <div className="role-banner">
          <span className={`role-badge role-${user.role}`}>{ROLE_LABEL[user.role]}</span>
          <span>{ROLE_ACCESS[user.role]}</span>
        </div>
      ) : (
        <div className="role-banner">
          <span className="role-badge role-public">Publik</span>
          <span>
            Anda dapat melihat daftar &amp; detail warung. <Link to="/login">Login</Link> untuk
            fitur pengelolaan sesuai role.
          </span>
        </div>
      )}

      {flash && (
        <Alert type="success" onClose={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <form
        className="filters card"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ search: searchInput.trim(), page: 1 });
        }}
      >
        <div className="field grow">
          <label htmlFor="search">Cari nama warung</label>
          <input
            id="search"
            type="search"
            placeholder="Ketik nama warung..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="category-filter">Kategori</label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value, page: 1 })}
          >
            <option value="">Semua kategori</option>
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {hasFilter && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setSearchInput('');
              setParams(new URLSearchParams());
            }}
          >
            Reset filter
          </button>
        )}
      </form>

      {loading ? (
        <StallSkeletonGrid count={PAGE_SIZE} />
      ) : error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : stalls.length === 0 ? (
        hasFilter ? (
          <EmptyState
            icon="🔍"
            title="Warung tidak ditemukan"
            description={`Tidak ada warung yang cocok dengan ${[
              search && `pencarian "${search}"`,
              category && `kategori "${category}"`,
            ]
              .filter(Boolean)
              .join(' dan ')}.`}
            action={
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSearchInput('');
                  setParams(new URLSearchParams());
                }}
              >
                Reset filter
              </button>
            }
          />
        ) : (
          <EmptyState
            title="Belum ada warung"
            description="Data warung di database masih kosong."
            action={
              canCreateStall(user) && (
                <Link className="btn btn-primary" to="/stalls/new">
                  + Tambah warung pertama
                </Link>
              )
            }
          />
        )
      ) : (
        <>
          <div className="stall-grid">
            {stalls.map((stall) => (
              <StallCard
                key={stall.id}
                stall={stall}
                user={user}
                onDelete={(s) => {
                  setDeleteError(null);
                  setToDelete(s);
                }}
              />
            ))}
          </div>
          <Pagination
            page={meta.page}
            limit={meta.limit}
            total={meta.total}
            onChange={(p) => updateParams({ page: p })}
          />
        </>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Hapus warung?"
        loading={deleting}
        error={deleteError}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      >
        <p>
          Warung <strong>{toDelete?.name}</strong> beserta menu dan review-nya akan dihapus
          permanen dari database.
        </p>
      </ConfirmDialog>
    </div>
  );
}
