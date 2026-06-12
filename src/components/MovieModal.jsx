import { useEffect } from 'react'
import './MovieModal.css'

const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780'
const FALLBACK_BACKDROP =
  'https://via.placeholder.com/780x439?text=Backdrop+Unavailable'

const formatRuntime = (runtime) => {
  if (!runtime) {
    return 'Runtime unavailable'
  }
  return `${runtime} min`
}

const formatGenres = (genres) => {
  if (!genres || genres.length === 0) {
    return 'Genres unavailable'
  }
  return genres.map((genre) => genre.name).join(', ')
}

const formatReleaseDate = (releaseDate) => {
  if (!releaseDate) {
    return 'Release date unavailable'
  }
  return releaseDate
}

const MovieModal = ({ movieId, movieDetails, isOpen, isLoading, error, onClose }) => {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscapeKey)
    return () => window.removeEventListener('keydown', handleEscapeKey)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const backdropUrl = movieDetails?.backdrop_path
    ? `${TMDB_BACKDROP_BASE_URL}${movieDetails.backdrop_path}`
    : FALLBACK_BACKDROP

  return (
    <div className="movie-modal-overlay" role="presentation" onClick={onClose}>
      <section
        className="movie-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movie-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="movie-modal__close-button"
          aria-label="Close movie details"
        >
          X
        </button>
        {isLoading && <p className="movie-modal__status">Loading movie details...</p>}
        {error && !isLoading && <p className="movie-modal__error">{error}</p>}
        {!isLoading && !error && movieDetails && (
          <div className="movie-modal__content">
            <img
              src={backdropUrl}
              alt={`${movieDetails.title} backdrop`}
              className="movie-modal__backdrop"
            />
            <h2 id="movie-modal-title">{movieDetails.title}</h2>
            <p><strong>Runtime:</strong> {formatRuntime(movieDetails.runtime)}</p>
            <p><strong>Release Date:</strong> {formatReleaseDate(movieDetails.release_date)}</p>
            <p><strong>Genres:</strong> {formatGenres(movieDetails.genres)}</p>
            <p className="movie-modal__overview">{movieDetails.overview || 'Overview unavailable.'}</p>
          </div>
        )}
        {!isLoading && !error && !movieDetails && (
          <p className="movie-modal__status">No movie details found for id {movieId}.</p>
        )}
      </section>
    </div>
  )
}

export default MovieModal
