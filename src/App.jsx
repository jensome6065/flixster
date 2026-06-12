import { useEffect, useState } from 'react'
import './App.css'
import MovieCard from './components/MovieCard'
import MovieModal from './components/MovieModal'
import SearchBar from './components/SearchBar'

const TMDB_NOW_PLAYING_URL = 'https://api.themoviedb.org/3/movie/now_playing'
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie'
const TMDB_MOVIE_DETAILS_URL = 'https://api.themoviedb.org/3/movie'

const App = () => {
  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMode, setActiveMode] = useState('now_playing')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [listError, setListError] = useState(null)
  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [selectedMovieDetails, setSelectedMovieDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState(null)

  const apiKey = import.meta.env.VITE_API_KEY

  const fetchMovies = async ({ page, mode, query, append = false }) => {
    if (!apiKey) {
      setListError(
        'Missing TMDb API key. Add VITE_API_KEY to your .env file.',
      )
      setIsLoadingList(false)
      return
    }

    try {
      setIsLoadingList(true)
      setListError(null)

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
      setListError(error.message || 'Unable to load movies right now.')
    } finally {
      setIsLoadingList(false)
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
    setSelectedMovieId(movieId)
  }

  const handleCloseModal = () => {
    setSelectedMovieId(null)
    setSelectedMovieDetails(null)
    setDetailsError(null)
    setIsLoadingDetails(false)
  }

  useEffect(() => {
    if (!selectedMovieId) {
      return
    }

    if (!apiKey) {
      setDetailsError('Missing TMDb API key. Add VITE_API_KEY to your .env file.')
      return
    }

    const fetchMovieDetails = async () => {
      try {
        setIsLoadingDetails(true)
        setDetailsError(null)

        const params = new URLSearchParams({
          api_key: apiKey,
          language: 'en-US',
        })

        const response = await fetch(
          `${TMDB_MOVIE_DETAILS_URL}/${selectedMovieId}?${params.toString()}`,
        )

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Movie details unavailable (not found).')
          }
          throw new Error(`Movie details request failed with status ${response.status}`)
        }

        const details = await response.json()
        setSelectedMovieDetails(details)
      } catch (error) {
        setDetailsError(error.message || 'Unable to load movie details right now.')
      } finally {
        setIsLoadingDetails(false)
      }
    }

    fetchMovieDetails()
  }, [apiKey, selectedMovieId])

  return (
    <div className="App">
      <h1>Flixster</h1>
      <SearchBar
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onSubmit={handleSearchSubmit}
        onClear={handleShowNowPlaying}
        isLoading={isLoadingList}
      />
      <p className="mode-label">
        Showing: {activeMode === 'search' ? `Search results for "${searchQuery}"` : 'Now Playing'}
      </p>
      {isLoadingList && <p>Loading movies from TMDb...</p>}
      {listError && <p className="error-message">{listError}</p>}
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onClick={handleMovieClick} />
        ))}
      </div>
      {movies.length === 0 && !isLoadingList && !listError && (
        <p className="empty-state">No movies found.</p>
      )}
      <div className="load-more-row">
        <button
          type="button"
          className="load-more-button"
          onClick={handleLoadMore}
          disabled={isLoadingList || !canLoadMore}
        >
          {canLoadMore ? 'Load More' : 'No More Movies'}
        </button>
      </div>
      <MovieModal
        movieId={selectedMovieId}
        movieDetails={selectedMovieDetails}
        isOpen={selectedMovieId !== null}
        isLoading={isLoadingDetails}
        error={detailsError}
        onClose={handleCloseModal}
      />
    </div>
  )
}

export default App
