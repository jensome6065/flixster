import './SearchBar.css'

const SearchBar = ({ query, onQueryChange, onSubmit, onClear, isLoading = false }) => {
  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <section className="search-bar" aria-label="Movie search controls">
      <form className="search-bar__form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search movies..."
          className="search-bar__input"
          aria-label="Search movies by title"
        />
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

export default SearchBar
