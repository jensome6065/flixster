import './SkeletonCard.css'

const SkeletonCard = () => {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__poster skeleton-shimmer" />
      <div className="skeleton-card__content">
        <div className="skeleton-card__title skeleton-shimmer" />
        <div className="skeleton-card__rating skeleton-shimmer" />
      </div>
    </div>
  )
}

export default SkeletonCard
