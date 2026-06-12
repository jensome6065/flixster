import { useEffect, useState } from 'react'
import './App.css'
import MovieCard from './components/MovieCard'
import SearchBar from './components/SearchBar'

const TMDB_NOW_PLAYING_URL = 'https://api.themoviedb.org/3/movie/now_playing'
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie'

const App = () => {
  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMode, setActiveMode] = useState('now_playing')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)

  const apiKey = import.meta.env.VITE_API_KEY

  const fetchMovies = async ({ page, mode, query, append = false }) => {
    if (!apiKey) {
      setErrorMessage(
        'Missing TMDb API key. Add VITE_TMDB_API_KEY to your .env file.',
      )
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const endpoint = mode === 'search' ? TMDB_SEARCH_URL : TMDB_NOW_PLAYING_URL
      const params = new URLSearchParams({
        api_key: apiKey,
        language: 'en-US',
        page: String(page),
      })

      if (mode === 'search') {
        params.set('query', query)
      }

      const response = await fetch(`${endpoint}?${params.toString()}`)

      if (!response.ok) {
        throw new Error(`TMDb request failed with status ${response.status}`)
      }

      const data = await response.json()
      const incomingMovies = data.results || []

      setMovies((prevMovies) =>
        append ? [...prevMovies, ...incomingMovies] : incomingMovies,
      )
      setCurrentPage(page)
      setTotalPages(data.total_pages || 1)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load movies right now.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMovies({ page: 1, mode: 'now_playing', query: '', append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearchSubmit = () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) {
      return
    }

    setActiveMode('search')
    fetchMovies({ page: 1, mode: 'search', query: trimmedQuery, append: false })
  }

  const handleShowNowPlaying = () => {
    setSearchQuery('')
    setActiveMode('now_playing')
    fetchMovies({ page: 1, mode: 'now_playing', query: '', append: false })
  }

  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    const queryForRequest = activeMode === 'search' ? searchQuery.trim() : ''
    fetchMovies({
      page: nextPage,
      mode: activeMode,
      query: queryForRequest,
      append: true,
    })
  }

  const canLoadMore = currentPage < totalPages

  const handleMovieClick = (movieId) => {
    console.log(`Selected movie id: ${movieId}`)
  }

  return (
    <div className="App">
      <h1>Flixster</h1>
      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onClear={handleShowNowPlaying}
        isLoading={isLoading}
      />
      <p className="mode-label">
        Showing: {activeMode === 'search' ? `Search results for "${searchQuery}"` : 'Now Playing'}
      </p>
      {isLoading && <p>Loading movies from TMDb...</p>}
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={handleMovieClick} />
        ))}
      </div>
      {movies.length === 0 && !isLoading && !errorMessage && (
        <p className="empty-state">No movies found.</p>
      )}
      <div className="load-more-row">
        <button
          type="button"
          className="load-more-button"
          onClick={handleLoadMore}
          disabled={isLoading || !canLoadMore}
        >
          {canLoadMore ? 'Load More' : 'No More Movies'}
        </button>
      </div>
    </div>
  )
}

export default App
