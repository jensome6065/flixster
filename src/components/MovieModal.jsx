import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import './MovieModal.css'

const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780'
const FALLBACK_BACKDROP =
  'https://via.placeholder.com/780x439?text=Backdrop+Unavailable'
const LOCATION_STORAGE_KEY = 'flixster_user_location'

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

const getUserLocation = () => {
  const stored = localStorage.getItem(LOCATION_STORAGE_KEY)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }
  return null
}

const saveUserLocation = (location) => {
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location))
}

const requestGeolocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: Date.now(),
        }
        saveUserLocation(location)
        resolve(location)
      },
      (error) => {
        reject(error)
      },
      { timeout: 10000 }
    )
  })
}

const buildTicketingLinks = (movieTitle, location) => {
  const encodedTitle = encodeURIComponent(movieTitle)
  const locationParam = location
    ? `${location.latitude},${location.longitude}`
    : 'current+location'

  const googleMapsQuery = location
    ? `https://www.google.com/maps/search/${encodedTitle}+theaters/@${location.latitude},${location.longitude},13z`
    : `https://www.google.com/maps/search/${encodedTitle}+theaters+near+me`

  return {
    fandango: `https://www.fandango.com/search?q=${encodedTitle}&location=${locationParam}`,
    google: `https://www.google.com/search?q=${encodedTitle}+tickets+near+me`,
    googleMaps: googleMapsQuery,
  }
}

const MovieModal = ({
  movieId,
  movieDetails,
  isOpen,
  isLoading,
  error,
  aiRecommendation,
  aiLoading,
  trailerKey,
  similarMovies,
  isLoadingSimilar,
  onClose,
  onMovieClick,
}) => {
  const [activeTab, setActiveTab] = useState('info')
  const [userLocation, setUserLocation] = useState(null)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [showTicketingOptions, setShowTicketingOptions] = useState(false)

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

  useEffect(() => {
    if (!isOpen) {
      return
    }
    setActiveTab('info')
    setShowTicketingOptions(false)
  }, [isOpen, movieId])

  useEffect(() => {
    const cachedLocation = getUserLocation()
    if (cachedLocation) {
      setUserLocation(cachedLocation)
    }
  }, [])

  const handleGetTickets = async () => {
    let location = userLocation

    if (!location) {
      setIsRequestingLocation(true)
      try {
        location = await requestGeolocation()
        setUserLocation(location)
      } catch (error) {
        console.warn('Could not get location:', error.message)
      } finally {
        setIsRequestingLocation(false)
      }
    }

    setShowTicketingOptions(true)
  }

  const handleTicketingLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const backdropUrl = movieDetails?.backdrop_path
    ? `${TMDB_BACKDROP_BASE_URL}${movieDetails.backdrop_path}`
    : FALLBACK_BACKDROP
  const trailerUrl = trailerKey
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&controls=1&modestbranding=1&playsinline=1&rel=0`
    : null

  if (!isOpen) {
    return null
  }

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
            <h2 id="movie-modal-title" className="movie-modal__title">
              {movieDetails.title}
            </h2>
            <div className="movie-modal__tabs" role="tablist" aria-label="Movie modal sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'info'}
                className={`movie-modal__tab-button ${activeTab === 'info' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                Info
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'trailer'}
                className={`movie-modal__tab-button ${activeTab === 'trailer' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('trailer')}
                disabled={!trailerUrl}
              >
                Trailer
              </button>
            </div>
            {activeTab === 'trailer' && trailerUrl ? (
              <div className="movie-modal__trailer-wrap">
                <iframe
                  className="movie-modal__trailer"
                  src={trailerUrl}
                  title={`${movieDetails.title} trailer`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : null}
            {activeTab === 'trailer' && !trailerUrl ? (
              <p className="movie-modal__status">No trailer is available for this movie.</p>
            ) : null}
            {activeTab === 'info' ? (
              <>
            <div className="movie-modal__metadata">
              <p>
                <strong>Runtime:</strong> {formatRuntime(movieDetails.runtime)}
              </p>
              <p>
                <strong>Release Date:</strong> {formatReleaseDate(movieDetails.release_date)}
              </p>
              <p>
                <strong>Genres:</strong> {formatGenres(movieDetails.genres)}
              </p>
            </div>
            <p className="movie-modal__overview">{movieDetails.overview || 'Overview unavailable.'}</p>
            <div className="movie-modal__ticketing">
              <button
                type="button"
                className="movie-modal__get-tickets-button"
                onClick={handleGetTickets}
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? 'Getting Location...' : 'Get Tickets'}
              </button>
              {showTicketingOptions && (
                <div className="movie-modal__ticketing-options">
                  <p className="movie-modal__ticketing-label">Choose a ticketing service:</p>
                  <button
                    type="button"
                    className="movie-modal__ticketing-option"
                    onClick={() => handleTicketingLink(buildTicketingLinks(movieDetails.title, userLocation).fandango)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Fandango
                  </button>
                  <button
                    type="button"
                    className="movie-modal__ticketing-option"
                    onClick={() => handleTicketingLink(buildTicketingLinks(movieDetails.title, userLocation).google)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Google Search
                  </button>
                  <button
                    type="button"
                    className="movie-modal__ticketing-option"
                    onClick={() => handleTicketingLink(buildTicketingLinks(movieDetails.title, userLocation).googleMaps)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Google Maps
                  </button>
                </div>
              )}
            </div>
            <section className="movie-modal__insight" aria-live="polite">
              <h3 className="movie-modal__insight-title">Watch Recommendation</h3>
              {aiLoading && <p className="movie-modal__status">Getting a recommendation...</p>}
              {!aiLoading && aiRecommendation && (
                <p className="movie-modal__insight-text">{aiRecommendation}</p>
              )}
            </section>
            {similarMovies && similarMovies.length > 0 && (
              <section className="movie-modal__similar">
                <h3 className="movie-modal__similar-title">More Like This</h3>
                <div className="movie-modal__similar-grid">
                  {similarMovies.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      className="movie-modal__similar-card"
                      onClick={() => onMovieClick(movie.id)}
                    >
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w154${movie.poster_path}`
                            : 'https://via.placeholder.com/154x231?text=No+Poster'
                        }
                        alt={movie.title}
                        className="movie-modal__similar-poster"
                      />
                      <div className="movie-modal__similar-info">
                        <p className="movie-modal__similar-name">{movie.title}</p>
                        <p className="movie-modal__similar-rating">
                          Rating: {movie.vote_average?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}
            {isLoadingSimilar && (
              <section className="movie-modal__similar">
                <h3 className="movie-modal__similar-title">More Like This</h3>
                <p className="movie-modal__status">Loading similar movies...</p>
              </section>
            )}
              </>
            ) : null}
          </div>
        )}
        {!isLoading && !error && !movieDetails && (
          <p className="movie-modal__status">No movie details found for id {movieId}.</p>
        )}
      </section>
    </div>
  )
}

MovieModal.propTypes = {
  movieId: PropTypes.number,
  movieDetails: PropTypes.shape({
    title: PropTypes.string,
    backdrop_path: PropTypes.string,
    runtime: PropTypes.number,
    release_date: PropTypes.string,
    genres: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        name: PropTypes.string,
      }),
    ),
    overview: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  aiRecommendation: PropTypes.string,
  aiLoading: PropTypes.bool,
  trailerKey: PropTypes.string,
  similarMovies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      title: PropTypes.string,
      poster_path: PropTypes.string,
      vote_average: PropTypes.number,
    }),
  ),
  isLoadingSimilar: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onMovieClick: PropTypes.func,
}

MovieModal.defaultProps = {
  movieId: null,
  movieDetails: null,
  error: null,
  aiRecommendation: null,
  aiLoading: false,
  trailerKey: null,
  similarMovies: [],
  isLoadingSimilar: false,
  onMovieClick: null,
}

export default MovieModal
