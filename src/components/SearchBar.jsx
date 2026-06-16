import PropTypes from 'prop-types'
import './SearchBar.css'

const SearchBar = ({
  query,
  onQueryChange,
  onSubmit,
  onClear,
  isLoading = false,
  suggestions = [],
  showSuggestions = false,
  onSuggestionClick,
  onFocus,
  onBlur,
  isLoadingSuggestions = false,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="search-bar" aria-label="Movie search controls">
      <form className="search-bar__form" onSubmit={handleSubmit}>
        <div className="search-bar__input-wrapper">
          <input
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Search movies..."
            className="search-bar__input"
            aria-label="Search movies by title"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-bar__clear-button"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
          {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
            <div className="search-bar__suggestions">
              {!query && !isLoadingSuggestions && (
                <div className="search-bar__suggestions-header">Trending This Week</div>
              )}
              {isLoadingSuggestions && (
                <div className="search-bar__suggestion-item search-bar__suggestion-item--loading">
                  Loading suggestions...
                </div>
              )}
              {!isLoadingSuggestions &&
                suggestions.map((movie) => (
                  <button
                    key={movie.id}
                    type="button"
                    className="search-bar__suggestion-item"
                    onMouseDown={() => onSuggestionClick(movie)}
                  >
                    <div className="search-bar__suggestion-content">
                      {movie.poster_path && (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="search-bar__suggestion-poster"
                        />
                      )}
                      <div className="search-bar__suggestion-info">
                        <div className="search-bar__suggestion-title">{movie.title}</div>
                        <div className="search-bar__suggestion-meta">
                          {movie.release_date?.substring(0, 4) || 'N/A'} • {movie.vote_average?.toFixed(1) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
        <button type="submit" disabled={isLoading} className="search-bar__button">
          Search
        </button>
        <button
          type="button"
          disabled={isLoading && !query}
          onClick={onClear}
          className="search-bar__button search-bar__button--secondary"
        >
          Now Playing
        </button>
      </form>
    </section>
  )
}

SearchBar.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      poster_path: PropTypes.string,
      release_date: PropTypes.string,
      vote_average: PropTypes.number,
    }),
  ),
  showSuggestions: PropTypes.bool,
  onSuggestionClick: PropTypes.func,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  isLoadingSuggestions: PropTypes.bool,
}

export default SearchBar
