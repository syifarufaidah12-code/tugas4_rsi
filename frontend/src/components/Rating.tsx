export function Rating({ value, count }: { value: number; count: number }) {
  const rounded = Math.round(value);
  return (
    <span className="rating" title={`Rating ${value.toFixed(2)} dari ${count} review`}>
      <span className="stars" aria-hidden="true">
        {'★'.repeat(rounded)}
        <span className="stars-off">{'★'.repeat(5 - rounded)}</span>
      </span>
      <strong>{value.toFixed(1)}</strong>
      <span className="muted">({count})</span>
    </span>
  );
}
