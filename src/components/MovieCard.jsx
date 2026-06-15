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

const MovieCard = ({ movie, onClick }) => {
  const { id, title, poster_path: posterPath, vote_average: voteAverage, release_date: releaseDate } = movie

  const posterUrl = posterPath
    ? `${TMDB_IMAGE_BASE_URL}${posterPath}`
    : POSTER_PLACEHOLDER

  const handleCardClick = () => {
    onClick(id)
  }

  return (
    <button
      type="button"
      className="movie-card"
      onClick={handleCardClick}
      aria-label={`View details for ${title}`}
    >
      <img className="movie-card__poster" src={posterUrl} alt={`${title} poster`} />
      <div className="movie-card__content">
        <h3 className="movie-card__title">{title}</h3>
        <p className="movie-card__vote">Vote Average: {formatVoteAverage(voteAverage)}</p>
        <p className="movie-card__release">{formatReleaseDate(releaseDate)}</p>
      </div>
    </button>
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
}

export default MovieCard
