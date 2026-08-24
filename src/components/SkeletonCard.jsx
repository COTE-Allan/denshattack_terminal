// placeholder card matching <card>'s exact box model, so swapping in real cards causes no layout shift
export function SkeletonCard() {
  return (
    <li className="card card--skeleton" aria-hidden="true">
      <div className="card__media">
        <div className="skeleton-shimmer" />
      </div>
      <div className="card__body">
        <div className="skeleton-line skeleton-line--title" />
        <div className="skeleton-line" />
        <div className="skeleton-line skeleton-line--short" />
      </div>
    </li>
  );
}

export default function SkeletonGrid({ count = 6 }) {
  return (
    <ul className="catalog__list" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </ul>
  );
}
