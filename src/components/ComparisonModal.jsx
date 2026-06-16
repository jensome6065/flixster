import PropTypes from 'prop-types'
import './ComparisonModal.css'

const ComparisonModal = ({ movies, isOpen, onClose }) => {
  if (!isOpen || movies.length === 0) {
    return null
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="comparison-modal-overlay" onClick={handleOverlayClick}>
      <div className="comparison-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="comparison-modal__close"
          onClick={onClose}
          aria-label="Close comparison"
        >
          ×
        </button>
        <h2 className="comparison-modal__title">Movie Comparison</h2>
        <div className="comparison-modal__grid">
          {movies.map((movie) => (
            <div key={movie.id} className="comparison-modal__movie">
              <img
                src={
                  movie.poster_path
                    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                    : 'https://via.placeholder.com/342x513?text=No+Poster'
                }
                alt={movie.title}
                className="comparison-modal__poster"
              />
              <div className="comparison-modal__details">
                <h3 className="comparison-modal__movie-title">{movie.title}</h3>
                <div className="comparison-modal__stat">
                  <span className="comparison-modal__stat-label">Rating</span>
                  <span className="comparison-modal__stat-value">
                    {movie.vote_average?.toFixed(1) || 'N/A'} / 10
                  </span>
                </div>
                <div className="comparison-modal__stat">
                  <span className="comparison-modal__stat-label">Release Date</span>
                  <span className="comparison-modal__stat-value">
                    {movie.release_date || 'Unknown'}
                  </span>
                </div>
                <div className="comparison-modal__stat">
                  <span className="comparison-modal__stat-label">Popularity</span>
                  <span className="comparison-modal__stat-value">
                    {movie.popularity?.toFixed(0) || 'N/A'}
                  </span>
                </div>
                {movie.overview && (
                  <div className="comparison-modal__overview">
                    <span className="comparison-modal__stat-label">Overview</span>
                    <p className="comparison-modal__overview-text">{movie.overview}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

ComparisonModal.propTypes = {
  movies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      poster_path: PropTypes.string,
      vote_average: PropTypes.number,
      release_date: PropTypes.string,
      popularity: PropTypes.number,
      overview: PropTypes.string,
    }),
  ).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
}

export default ComparisonModal
