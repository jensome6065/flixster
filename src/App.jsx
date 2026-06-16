import { useMemo, useEffect, useState, useCallback, useRef } from 'react'
import './App.css'
import Footer from './components/Footer'
import Header from './components/Header'
import MovieCard from './components/MovieCard'
import MovieModal from './components/MovieModal'
import SearchBar from './components/SearchBar'
import Sidebar from './components/Sidebar'
import SkeletonCard from './components/SkeletonCard'
import ComparisonModal from './components/ComparisonModal'

const TMDB_NOW_PLAYING_URL = 'https://api.themoviedb.org/3/movie/now_playing'
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie'
const TMDB_MOVIE_DETAILS_URL = 'https://api.themoviedb.org/3/movie'
const OPENROUTER_CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
]
const OPENROUTER_APP_TITLE = 'Flixster Movie Insight'
const OPENROUTER_APP_URL = 'http://localhost:5173'
const AI_FALLBACK_MESSAGE =
  "We couldn't generate a recommendation for this one - check out the overview above!"
const DESKTOP_HOVER_QUERY = '(hover: hover) and (pointer: fine) and (min-width: 1024px)'
const FEATURED_ROTATION_INTERVAL_MS = 9000
const FEATURED_CROSSFADE_DURATION_MS = 560

const App = () => {
  const [movies, setMovies] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeMode, setActiveMode] = useState('now_playing')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortOption, setSortOption] = useState('default')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [listError, setListError] = useState(null)
  const [selectedMovieId, setSelectedMovieId] = useState(null)
  const [selectedMovieDetails, setSelectedMovieDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState(null)
  const [aiRecommendation, setAiRecommendation] = useState(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [aiRecommendationCache, setAiRecommendationCache] = useState({})
  const [favoriteMoviesById, setFavoriteMoviesById] = useState({})
  const [watchedMoviesById, setWatchedMoviesById] = useState({})
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)
  const [trailerKeysByMovieId, setTrailerKeysByMovieId] = useState({})
  const [hoveredMovieId, setHoveredMovieId] = useState(null)
  const [isDesktopHoverPreviewEnabled, setIsDesktopHoverPreviewEnabled] = useState(false)
  const [hoverPreview, setHoverPreview] = useState(null)
  const [featuredMovieIndex, setFeaturedMovieIndex] = useState(0)
  const [featuredTransitionFromIndex, setFeaturedTransitionFromIndex] = useState(null)
  const [parallaxOffset, setParallaxOffset] = useState(0)
  const [similarMovies, setSimilarMovies] = useState([])
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false)
  const [comparisonMovies, setComparisonMovies] = useState([])
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false)
  const hoverPreviewTimeoutRef = useRef(null)
  const featuredTransitionTimeoutRef = useRef(null)

  const apiKey = import.meta.env.VITE_API_KEY
  const openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY

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

  const fetchSimilarMovies = useCallback(async (movieId) => {
    if (!apiKey || !movieId) {
      return
    }

    try {
      setIsLoadingSimilar(true)
      const params = new URLSearchParams({
        api_key: apiKey,
        language: 'en-US',
        page: '1',
      })

      const response = await fetch(
        `${TMDB_MOVIE_DETAILS_URL}/${movieId}/similar?${params.toString()}`,
      )

      if (!response.ok) {
        throw new Error(`Similar movies request failed with status ${response.status}`)
      }

      const data = await response.json()
      setSimilarMovies(data.results?.slice(0, 6) || [])
    } catch (error) {
      setSimilarMovies([])
    } finally {
      setIsLoadingSimilar(false)
    }
  }, [apiKey])

  useEffect(() => {
    fetchMovies({ page: 1, mode: 'now_playing', query: '', append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_HOVER_QUERY)
    const syncDesktopPreviewSupport = () => {
      setIsDesktopHoverPreviewEnabled(mediaQuery.matches)
    }

    syncDesktopPreviewSupport()
    mediaQuery.addEventListener('change', syncDesktopPreviewSupport)

    return () => {
      mediaQuery.removeEventListener('change', syncDesktopPreviewSupport)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (hoverPreviewTimeoutRef.current) {
        window.clearTimeout(hoverPreviewTimeoutRef.current)
      }
      if (featuredTransitionTimeoutRef.current) {
        window.clearTimeout(featuredTransitionTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY
      setParallaxOffset(scrolled * 0.5)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
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

  const getPreferredTrailerKey = useCallback((videos = []) => {
    const youtubeVideos = videos.filter((video) => video.site === 'YouTube' && video.key)
    const trailerCandidates = youtubeVideos.filter((video) => video.type === 'Trailer')
    const teaserCandidates = youtubeVideos.filter((video) => video.type === 'Teaser')

    const sortedCandidates = [...trailerCandidates, ...teaserCandidates].sort((a, b) => {
      const officialScore = Number(Boolean(b.official)) - Number(Boolean(a.official))
      if (officialScore !== 0) {
        return officialScore
      }
      return new Date(b.published_at || 0) - new Date(a.published_at || 0)
    })

    return sortedCandidates[0]?.key || null
  }, [])

  const fetchMovieTrailerKey = useCallback(async (movieId) => {
    if (!movieId || !apiKey) {
      return null
    }

    const movieKey = String(movieId)
    if (Object.prototype.hasOwnProperty.call(trailerKeysByMovieId, movieKey)) {
      return trailerKeysByMovieId[movieKey]
    }

    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        language: 'en-US',
      })
      const response = await fetch(
        `${TMDB_MOVIE_DETAILS_URL}/${movieId}/videos?${params.toString()}`,
      )

      if (!response.ok) {
        throw new Error(`Trailer request failed with status ${response.status}`)
      }

      const data = await response.json()
      const trailerKey = getPreferredTrailerKey(data.results || [])
      setTrailerKeysByMovieId((previous) => ({
        ...previous,
        [movieKey]: trailerKey,
      }))
      return trailerKey
    } catch (_error) {
      setTrailerKeysByMovieId((previous) => ({
        ...previous,
        [movieKey]: null,
      }))
      return null
    }
  }, [apiKey, getPreferredTrailerKey, trailerKeysByMovieId])

  const handleMovieHoverStart = async (movie, cardElement) => {
    if (!movie?.id) {
      return
    }

    if (!isDesktopHoverPreviewEnabled) {
      return
    }

    setHoveredMovieId(movie.id)
    setHoverPreview(null)

    if (hoverPreviewTimeoutRef.current) {
      window.clearTimeout(hoverPreviewTimeoutRef.current)
    }

    hoverPreviewTimeoutRef.current = window.setTimeout(async () => {
      const trailerKey = await fetchMovieTrailerKey(movie.id)
      if (!trailerKey) {
        return
      }

      const rect = cardElement?.getBoundingClientRect()
      const panelWidth = 540
      const panelHeight = 340
      const leftGuess = rect ? rect.left + rect.width / 2 - panelWidth / 2 : 24
      const topGuess = rect ? rect.top - 18 : 24
      const clampedLeft = Math.max(16, Math.min(leftGuess, window.innerWidth - panelWidth - 16))
      const clampedTop = Math.max(16, Math.min(topGuess, window.innerHeight - panelHeight - 16))

      setHoverPreview({
        movieId: movie.id,
        title: movie.title,
        voteAverage: movie.vote_average,
        trailerKey,
        top: clampedTop,
        left: clampedLeft,
      })
    }, 260)
  }

  const handleMovieHoverEnd = (movieId) => {
    if (hoverPreviewTimeoutRef.current) {
      window.clearTimeout(hoverPreviewTimeoutRef.current)
      hoverPreviewTimeoutRef.current = null
    }

    setHoveredMovieId((currentHoveredMovieId) =>
      currentHoveredMovieId === movieId ? null : currentHoveredMovieId,
    )
    setHoverPreview((currentPreview) =>
      currentPreview?.movieId === movieId ? null : currentPreview,
    )
  }

  const handleFavoriteToggle = (movie) => {
    const movieKey = String(movie.id)
    setFavoriteMoviesById((previousFavorites) => {
      if (previousFavorites[movieKey]) {
        const remainingFavorites = { ...previousFavorites }
        delete remainingFavorites[movieKey]
        return remainingFavorites
      }

      return {
        ...previousFavorites,
        [movieKey]: movie,
      }
    })
  }

  const handleWatchedToggle = (movie) => {
    const movieKey = String(movie.id)
    setWatchedMoviesById((previousWatched) => {
      if (previousWatched[movieKey]) {
        const remainingWatched = { ...previousWatched }
        delete remainingWatched[movieKey]
        return remainingWatched
      }

      return {
        ...previousWatched,
        [movieKey]: movie,
      }
    })
  }

  const handleCloseModal = () => {
    setSelectedMovieId(null)
    setSelectedMovieDetails(null)
    setDetailsError(null)
    setIsLoadingDetails(false)
    setAiRecommendation(null)
    setIsLoadingAi(false)
    setHoverPreview(null)
    setSimilarMovies([])
  }

  const handleToggleComparison = (movie) => {
    setComparisonMovies((prev) => {
      const isAlreadySelected = prev.some((m) => m.id === movie.id)
      if (isAlreadySelected) {
        return prev.filter((m) => m.id !== movie.id)
      }
      if (prev.length >= 3) {
        return prev
      }
      return [...prev, movie]
    })
  }

  const handleClearComparison = () => {
    setComparisonMovies([])
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

  useEffect(() => {
    if (!selectedMovieId) {
      return
    }
    fetchMovieTrailerKey(selectedMovieId)
    fetchSimilarMovies(selectedMovieId)
  }, [fetchMovieTrailerKey, fetchSimilarMovies, selectedMovieId])

  const getMovieInsight = useCallback(async (title, genres, overview) => {
    if (!openRouterApiKey) {
      throw new Error('Missing OpenRouter API key. Add VITE_OPENROUTER_API_KEY to your .env file.')
    }

    let lastError = null

    for (const model of OPENROUTER_MODELS) {
      const response = await fetch(OPENROUTER_CHAT_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': OPENROUTER_APP_URL,
          'X-Title': OPENROUTER_APP_TITLE,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an enthusiastic but honest film critic. Write spoiler-free watch guidance in plain text. Use 2-3 sentences, avoid first-person statements, avoid generic hype like "must-see", and do not invent details not provided.',
            },
            {
              role: 'user',
              content: `Write a short watch recommendation for this movie.
Title: ${title}
Genres: ${genres}
Overview: ${overview}

Focus on who this movie is for and what kind of evening watch experience it offers. Keep it plain text and spoiler-free.`,
            },
          ],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const apiMessage =
          data?.error?.message || data?.message || `OpenRouter request failed with status ${response.status}`
        lastError = new Error(apiMessage)
        continue
      }

      const content = data?.choices?.[0]?.message?.content?.trim()

      if (!content) {
        lastError = new Error('OpenRouter returned an empty recommendation.')
        continue
      }

      return content
    }

    throw lastError || new Error('OpenRouter could not return a recommendation.')
  }, [openRouterApiKey])

  useEffect(() => {
    if (!selectedMovieId || !selectedMovieDetails || detailsError) {
      return
    }

    let cancelled = false

    const fetchAiRecommendation = async () => {
      const genres = selectedMovieDetails.genres?.map((genre) => genre.name).join(', ') || 'Unknown'
      const overview = selectedMovieDetails.overview || 'Overview unavailable.'
      const cacheKey = String(selectedMovieId)

      if (aiRecommendationCache[cacheKey]) {
        setAiRecommendation(aiRecommendationCache[cacheKey])
        setIsLoadingAi(false)
        return
      }

      try {
        setIsLoadingAi(true)
        setAiRecommendation(null)

        const insight = await getMovieInsight(selectedMovieDetails.title, genres, overview)
        if (!cancelled) {
          setAiRecommendation(insight)
          setAiRecommendationCache((prevCache) => ({
            ...prevCache,
            [cacheKey]: insight,
          }))
        }
      } catch (error) {
        if (!cancelled) {
          setAiRecommendation(AI_FALLBACK_MESSAGE)
        }
      } finally {
        if (!cancelled) {
          setIsLoadingAi(false)
        }
      }
    }

    fetchAiRecommendation()

    return () => {
      cancelled = true
    }
  }, [aiRecommendationCache, detailsError, getMovieInsight, selectedMovieDetails, selectedMovieId])

  const sortedMovies = useMemo(() => {
    const moviesCopy = [...movies]

    if (sortOption === 'default') {
      return moviesCopy
    }

    if (sortOption === 'vote_desc') {
      return moviesCopy.sort(
        (a, b) => (b.vote_average || 0) - (a.vote_average || 0),
      )
    }

    if (sortOption === 'release_desc') {
      return moviesCopy.sort(
        (a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0),
      )
    }

    return moviesCopy.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  }, [movies, sortOption])

  const featuredMovies = useMemo(() => {
    if (activeMode !== 'now_playing') {
      return []
    }

    return [...movies]
      .filter((movie) => typeof movie.vote_average === 'number')
      .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
      .slice(0, 6)
  }, [activeMode, movies])

  useEffect(() => {
    setFeaturedMovieIndex(0)
    setFeaturedTransitionFromIndex(null)
  }, [featuredMovies.length])

  const featuredMovie = featuredMovies[featuredMovieIndex] || null
  const featuredTransitionFromMovie = featuredTransitionFromIndex === null
    ? null
    : featuredMovies[featuredTransitionFromIndex] || null

  const transitionToFeaturedIndex = useCallback((nextIndex) => {
    if (
      featuredMovies.length === 0
      || nextIndex < 0
      || nextIndex >= featuredMovies.length
      || nextIndex === featuredMovieIndex
    ) {
      return
    }

    setFeaturedTransitionFromIndex(featuredMovieIndex)
    setFeaturedMovieIndex(nextIndex)

    if (featuredTransitionTimeoutRef.current) {
      window.clearTimeout(featuredTransitionTimeoutRef.current)
    }

    featuredTransitionTimeoutRef.current = window.setTimeout(() => {
      setFeaturedTransitionFromIndex(null)
    }, FEATURED_CROSSFADE_DURATION_MS)
  }, [featuredMovieIndex, featuredMovies.length])

  useEffect(() => {
    if (!featuredMovie?.id) {
      return
    }
    fetchMovieTrailerKey(featuredMovie.id)
  }, [featuredMovie?.id, fetchMovieTrailerKey])

  useEffect(() => {
    if (featuredMovies.length <= 1) {
      return undefined
    }

    const rotationId = window.setInterval(() => {
      transitionToFeaturedIndex((featuredMovieIndex + 1) % featuredMovies.length)
    }, FEATURED_ROTATION_INTERVAL_MS)

    return () => {
      window.clearInterval(rotationId)
    }
  }, [featuredMovieIndex, featuredMovies.length, transitionToFeaturedIndex])

  const favoritedMovies = useMemo(
    () =>
      Object.values(favoriteMoviesById).sort((a, b) =>
        (a.title || '').localeCompare(b.title || ''),
      ),
    [favoriteMoviesById],
  )

  const watchedMovies = useMemo(
    () =>
      Object.values(watchedMoviesById).sort((a, b) =>
        (a.title || '').localeCompare(b.title || ''),
      ),
    [watchedMoviesById],
  )

  const selectedMovieTrailerKey = selectedMovieId
    ? trailerKeysByMovieId[String(selectedMovieId)] ?? null
    : null
  const featuredTrailerKey = featuredMovie?.id
    ? trailerKeysByMovieId[String(featuredMovie.id)] ?? null
    : null
  const featuredTrailerUrl = featuredTrailerKey
    ? `https://www.youtube.com/embed/${featuredTrailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${featuredTrailerKey}`
    : null
  const featuredTransitionFromTrailerKey = featuredTransitionFromMovie?.id
    ? trailerKeysByMovieId[String(featuredTransitionFromMovie.id)] ?? null
    : null
  const featuredTransitionFromTrailerUrl = featuredTransitionFromTrailerKey
    ? `https://www.youtube.com/embed/${featuredTransitionFromTrailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${featuredTransitionFromTrailerKey}`
    : null
  const hoverPreviewTrailerUrl = hoverPreview?.trailerKey
    ? `https://www.youtube.com/embed/${hoverPreview.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${hoverPreview.trailerKey}`
    : null

  const renderFeaturedSlide = (movie, trailerUrl, isEntering = false, isLeaving = false) => (
    <div
      className={`featured-banner ${isEntering ? 'featured-banner--entering' : ''} ${isLeaving ? 'featured-banner--leaving' : ''}`.trim()}
      key={`${movie.id}-${isEntering ? 'enter' : isLeaving ? 'leave' : 'current'}`}
    >
      <div className="featured-banner__background">
        <img
          className="featured-banner__background-image"
          src={
            movie.backdrop_path
              ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
              : 'https://via.placeholder.com/1280x720?text=Backdrop+Unavailable'
          }
          alt=""
          aria-hidden="true"
          style={{ transform: `translateY(${parallaxOffset}px)` }}
        />
        <div className="featured-banner__overlay" aria-hidden="true" />
      </div>
      <div className="featured-banner__content">
        <p className="featured-banner__label">Featured</p>
        <h2 className="featured-banner__title">{movie.title}</h2>
        <p className="featured-banner__meta">
          Rating {movie.vote_average?.toFixed(1) || 'N/A'}
          {movie.release_date ? ` • ${movie.release_date}` : ''}
        </p>
        <p className="featured-banner__overview">
          {movie.overview || 'No overview available for this title yet.'}
        </p>
        <div className="featured-banner__actions">
          <button
            type="button"
            className="featured-banner__action featured-banner__action--primary"
            onClick={() => handleMovieClick(movie.id)}
          >
            More Info
          </button>
        </div>
      </div>
      <div className="featured-banner__media">
        {trailerUrl ? (
          <iframe
            className="featured-banner__trailer"
            src={trailerUrl}
            title={`${movie.title} featured trailer`}
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <img
            className="featured-banner__fallback"
            src={
              movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}`
                : 'https://via.placeholder.com/780x439?text=Trailer+Unavailable'
            }
            alt={`${movie.title} trailer unavailable`}
          />
        )}
      </div>
    </div>
  )

  return (
    <div className="App">
      <Header />
      <main className="app-main">
        <div className={`app-layout ${isSidebarVisible ? '' : 'app-layout--full'}`.trim()}>
          <section className="app-content">
            {featuredMovie && (
              <section className="featured-banner-shell" aria-label="Featured now playing movie">
                <button
                  type="button"
                  className="featured-banner-nav featured-banner-nav--left"
                  onClick={() =>
                    transitionToFeaturedIndex(
                      featuredMovieIndex === 0 ? featuredMovies.length - 1 : featuredMovieIndex - 1,
                    )
                  }
                  disabled={featuredMovies.length < 2}
                  aria-label="Show previous featured movie"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M15 6 9 12l6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <div className="featured-banner-viewport">
                  {featuredTransitionFromMovie
                    && renderFeaturedSlide(
                      featuredTransitionFromMovie,
                      featuredTransitionFromTrailerUrl,
                      false,
                      true,
                    )}
                  {renderFeaturedSlide(
                    featuredMovie,
                    featuredTrailerUrl,
                    featuredTransitionFromMovie !== null,
                    false,
                  )}
                </div>
                <button
                  type="button"
                  className="featured-banner-nav featured-banner-nav--right"
                  onClick={() => transitionToFeaturedIndex((featuredMovieIndex + 1) % featuredMovies.length)}
                  disabled={featuredMovies.length < 2}
                  aria-label="Show next featured movie"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="m9 6 6 6-6 6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </section>
            )}
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
            <div className="controls-row">
              <div className="sort-row">
                <label htmlFor="sort-select">Sort by:</label>
                <select
                  id="sort-select"
                  className="sort-select"
                  value={sortOption}
                  onChange={(event) => setSortOption(event.target.value)}
                >
                  <option value="default">Default (TMDb Order)</option>
                  <option value="title_asc">Title (A-Z)</option>
                  <option value="release_desc">Release Date (Newest)</option>
                  <option value="vote_desc">Vote Average (Highest)</option>
                </select>
              </div>
              <button
                type="button"
                className="sidebar-toggle-button"
                onClick={() => setIsSidebarVisible((previous) => !previous)}
              >
                {isSidebarVisible ? 'Hide Lists' : 'Show Lists'}
              </button>
            </div>
            {listError && <p className="error-message">{listError}</p>}
            {comparisonMovies.length > 0 && (
              <div className="comparison-bar">
                <div className="comparison-bar__header">
                  <h3 className="comparison-bar__title">
                    Compare Movies ({comparisonMovies.length}/3)
                  </h3>
                  <button
                    type="button"
                    className="comparison-bar__clear"
                    onClick={handleClearComparison}
                  >
                    Clear All
                  </button>
                </div>
                <div className="comparison-bar__movies">
                  {comparisonMovies.map((movie) => (
                    <div key={movie.id} className="comparison-bar__movie">
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                            : 'https://via.placeholder.com/92x138?text=No+Poster'
                        }
                        alt={movie.title}
                        className="comparison-bar__poster"
                      />
                      <div className="comparison-bar__info">
                        <p className="comparison-bar__movie-title">{movie.title}</p>
                        <p className="comparison-bar__movie-rating">
                          Rating: {movie.vote_average?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="comparison-bar__remove"
                        onClick={() => handleToggleComparison(movie)}
                        aria-label={`Remove ${movie.title} from comparison`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {comparisonMovies.length >= 2 && (
                  <button
                    type="button"
                    className="comparison-bar__compare-button"
                    onClick={() => setIsComparisonModalOpen(true)}
                  >
                    Compare Selected
                  </button>
                )}
              </div>
            )}
            <div className={`movie-grid ${isSidebarVisible ? 'movie-grid--with-sidebar' : ''}`.trim()}>
              {isLoadingList
                ? Array.from({ length: 8 }).map((_, index) => <SkeletonCard key={`skeleton-${index}`} />)
                : sortedMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={handleMovieClick}
                      onHoverStart={handleMovieHoverStart}
                      onHoverEnd={handleMovieHoverEnd}
                      onFavoriteToggle={handleFavoriteToggle}
                      isFavorite={Boolean(favoriteMoviesById[String(movie.id)])}
                      onWatchedToggle={handleWatchedToggle}
                      isWatched={Boolean(watchedMoviesById[String(movie.id)])}
                      trailerKey={trailerKeysByMovieId[String(movie.id)] ?? null}
                      isPreviewPlaying={false}
                      isDimmed={hoveredMovieId !== null && hoveredMovieId !== movie.id}
                      onComparisonToggle={handleToggleComparison}
                      isInComparison={comparisonMovies.some((m) => m.id === movie.id)}
                      isComparisonFull={comparisonMovies.length >= 3}
                    />
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
          </section>
          {isSidebarVisible && (
            <div className="app-sidebar">
              <Sidebar
                favoritedMovies={favoritedMovies}
                watchedMovies={watchedMovies}
              />
            </div>
          )}
        </div>
      </main>
      {isDesktopHoverPreviewEnabled && hoverPreview && hoverPreviewTrailerUrl && (
        <div
          className="hover-preview-panel"
          style={{ top: `${hoverPreview.top}px`, left: `${hoverPreview.left}px` }}
          aria-hidden="true"
        >
          <iframe
            className="hover-preview-panel__iframe"
            src={hoverPreviewTrailerUrl}
            title={`${hoverPreview.title} projected preview`}
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            tabIndex={-1}
          />
          <div className="hover-preview-panel__meta">
            <strong>{hoverPreview.title}</strong>
            <span>
              {typeof hoverPreview.voteAverage === 'number'
                ? `Rating ${hoverPreview.voteAverage.toFixed(1)}`
                : 'Trailer Preview'}
            </span>
          </div>
        </div>
      )}
      <Footer />
      <MovieModal
        movieId={selectedMovieId}
        movieDetails={selectedMovieDetails}
        isOpen={selectedMovieId !== null}
        isLoading={isLoadingDetails}
        error={detailsError}
        aiRecommendation={aiRecommendation}
        aiLoading={isLoadingAi}
        trailerKey={selectedMovieTrailerKey}
        similarMovies={similarMovies}
        isLoadingSimilar={isLoadingSimilar}
        onClose={handleCloseModal}
        onMovieClick={handleMovieClick}
      />
      <ComparisonModal
        movies={comparisonMovies}
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
      />
    </div>
  )
}

export default App
