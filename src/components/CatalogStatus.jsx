// shared loading/error placeholder for every island that fetches wordpress client-side
export default function CatalogStatus({ loading, error }) {
  if (loading) {
    return (
      <div className="catalog__loading">
        <span className="catalog__spinner" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    );
  }

  if (error) return <p className="catalog__empty">Couldn't reach the catalogue. Try refreshing.</p>;

  return null;
}
