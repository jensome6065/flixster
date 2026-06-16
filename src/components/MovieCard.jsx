import PropTypes from 'prop-types'
import './MovieCard.css'

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w342'
const POSTER_PLACEHOLDER =
  'https://via.placeholder.com/342x513?text=No+Poster+Available'

const formatVoteAverage = (voteAverage) => {
  if (typeof voteAverage !== 'number') {
    return 'N/A'
  }

  return voteAverage.toFixed(1)
}

const formatVoteCount = (voteCount) => {
  if (typeof voteCount !== 'number') {
    return ''
  }

  if (voteCount >= 1000) {
    return `(${(voteCount / 1000).toFixed(1)}k votes)`
  }

  return `(${voteCount} votes)`
}

const formatReleaseDate = (releaseDate) => {
  if (!releaseDate) {
    return 'Release date unavailable'
  }

  return releaseDate
}

const MovieCard = ({
  movie,
  onClick,
  onHoverStart,
  onHoverEnd,
  onFavoriteToggle,
  isFavorite,
  onWatchedToggle,
  isWatched,
  trailerKey,
  isPreviewPlaying,
  isDimmed,
  onComparisonToggle,
  isInComparison,
  isComparisonFull,
}) => {
  const { id, title, poster_path: posterPath, vote_average: voteAverage, vote_count: voteCount, release_date: releaseDate } = movie

  const posterUrl = posterPath
    ? `${TMDB_IMAGE_BASE_URL}${posterPath}`
    : POSTER_PLACEHOLDER

  const handleCardClick = () => {
    onClick(id)
  }

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick(id)
    }
  }

  const handleFavoriteClick = (event) => {
    event.stopPropagation()
    onFavoriteToggle(movie)
  }

  const handleWatchedClick = (event) => {
    event.stopPropagation()
    onWatchedToggle(movie)
  }

  const handleButtonMouseEnter = (event) => {
    event.stopPropagation()
    onHoverEnd(id)
  }

  const handleButtonMouseLeave = (event) => {
    event.stopPropagation()
  }

  const handleComparisonToggle = (event) => {
    event.stopPropagation()
    if (onComparisonToggle) {
      onComparisonToggle(movie)
    }
  }

  const trailerPreviewUrl = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${trailerKey}`
    : null

  const handlePosterHoverStart = (event) => {
    onHoverStart(movie, event.currentTarget.closest('.movie-card'))
  }

  const handlePosterHoverEnd = () => {
    onHoverEnd(id)
  }

  return (
    <article
      className={`movie-card ${isFavorite ? 'movie-card--favorite' : ''} ${isWatched ? 'movie-card--watched' : ''} ${isPreviewPlaying ? 'movie-card--previewing' : ''} ${isDimmed ? 'movie-card--dimmed' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${title}`}
    >
      <button
        type="button"
        className={`movie-card__watched-button ${isWatched ? 'is-active' : ''}`}
        onClick={handleWatchedClick}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        aria-label={`${isWatched ? 'Mark' : 'Mark'} ${title} as ${isWatched ? 'unwatched' : 'watched'}`}
      >
        <svg
          className="movie-card__watched-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M9.2 16.2 5.5 12.5l1.4-1.4 2.3 2.3 7-7 1.4 1.4z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        className={`movie-card__favorite-button ${isFavorite ? 'is-active' : ''}`}
        onClick={handleFavoriteClick}
        onMouseEnter={handleButtonMouseEnter}
        onMouseLeave={handleButtonMouseLeave}
        aria-label={`${isFavorite ? 'Remove' : 'Add'} ${title} ${isFavorite ? 'from' : 'to'} favorites`}
      >
        <svg
          className="movie-card__favorite-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M12 21c-.2 0-.4-.1-.6-.2l-6.5-6.1C2.2 12.2 2 9.6 4 7.6c1.9-1.9 4.9-1.9 6.8 0L12 8.8l1.2-1.2c1.9-1.9 4.9-1.9 6.8 0 2 2 1.8 4.6-.9 7.1l-6.5 6.1c-.2.1-.4.2-.6.2z"
            fill={isFavorite ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div
        className="movie-card__media"
        onMouseEnter={handlePosterHoverStart}
        onMouseLeave={handlePosterHoverEnd}
      >
        <img className="movie-card__poster" src={posterUrl} alt={`${title} poster`} />
        {isPreviewPlaying && trailerPreviewUrl && (
          <>
            <iframe
              className="movie-card__trailer-preview"
              src={trailerPreviewUrl}
              title={`${title} trailer preview`}
              allow="autoplay; encrypted-media; picture-in-picture"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              tabIndex={-1}
            />
            <div className="movie-card__projector-overlay" aria-hidden="true" />
            <span className="movie-card__now-playing" aria-hidden="true">
              Now Playing
            </span>
          </>
        )}
      </div>
      <div className="movie-card__content">
        <h3 className="movie-card__title">{title}</h3>
        <p className="movie-card__vote">
          Rating: {formatVoteAverage(voteAverage)} {formatVoteCount(voteCount)}
        </p>
        <p className="movie-card__release">{formatReleaseDate(releaseDate)}</p>
        {onComparisonToggle && (
          <label
            className="movie-card__compare-label"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="movie-card__compare-checkbox"
              checked={isInComparison}
              onChange={handleComparisonToggle}
              disabled={!isInComparison && isComparisonFull}
              aria-label={`${isInComparison ? 'Remove from' : 'Add to'} comparison`}
            />
            <span className="movie-card__compare-text">
              {isInComparison ? 'In Comparison' : 'Compare'}
            </span>
          </label>
        )}
      </div>
    </article>
  )
}

MovieCard.propTypes = {
  movie: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    poster_path: PropTypes.string,
    vote_average: PropTypes.number,
    vote_count: PropTypes.number,
    release_date: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onHoverStart: PropTypes.func.isRequired,
  onHoverEnd: PropTypes.func.isRequired,
  onFavoriteToggle: PropTypes.func.isRequired,
  isFavorite: PropTypes.bool.isRequired,
  onWatchedToggle: PropTypes.func.isRequired,
  isWatched: PropTypes.bool.isRequired,
  trailerKey: PropTypes.string,
  isPreviewPlaying: PropTypes.bool.isRequired,
  isDimmed: PropTypes.bool.isRequired,
  onComparisonToggle: PropTypes.func,
  isInComparison: PropTypes.bool,
  isComparisonFull: PropTypes.bool,
}

MovieCard.defaultProps = {
  onComparisonToggle: null,
  isInComparison: false,
  isComparisonFull: false,
}

export default MovieCard
