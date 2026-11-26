interface Props {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
  /** Kata benda pada teks info, mis. "warung" atau "catatan". */
  itemLabel?: string;
}

export function Pagination({ page, limit, total, onChange, itemLabel = 'warung' }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Tampilkan maksimal 5 nomor halaman di sekitar halaman aktif.
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Menampilkan {from}–{to} dari {total} {itemLabel}
      </span>
      <div className="pagination-buttons">
        <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ‹ Sebelumnya
        </button>
        {pages.map((p) => (
          <button
            key={p}
            className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          className="btn btn-ghost btn-sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Berikutnya ›
        </button>
      </div>
    </div>
  );
}
