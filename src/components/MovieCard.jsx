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
}) => {
  const { id, title, poster_path: posterPath, vote_average: voteAverage, release_date: releaseDate } = movie

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

  const trailerPreviewUrl = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${trailerKey}`
    : null

  return (
    <article
      className={`movie-card ${isFavorite ? 'movie-card--favorite' : ''} ${isWatched ? 'movie-card--watched' : ''} ${isPreviewPlaying ? 'movie-card--previewing' : ''} ${isDimmed ? 'movie-card--dimmed' : ''}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onMouseEnter={(event) => onHoverStart(movie, event.currentTarget)}
      onMouseLeave={() => onHoverEnd(id)}
      onFocus={(event) => onHoverStart(movie, event.currentTarget)}
      onBlur={() => onHoverEnd(id)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${title}`}
    >
      <button
        type="button"
        className={`movie-card__watched-button ${isWatched ? 'is-active' : ''}`}
        onClick={handleWatchedClick}
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
      <div className="movie-card__media">
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
        <p className="movie-card__vote">Vote Average: {formatVoteAverage(voteAverage)}</p>
        <p className="movie-card__release">{formatReleaseDate(releaseDate)}</p>
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
}

export default MovieCard
