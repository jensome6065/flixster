# Flixster Project Planning

## 1) Component Architecture

### Parent-child hierarchy

- `App`
  - `Header`
  - `SearchBar`
  - `SortControl`
  - `MovieList`
    - `MovieCard` (repeated for each movie)
  - `MovieModal` (conditionally rendered when a movie is selected)
  - `Footer`

### Component specs

#### `App`
- **Responsibility:** Owns the core app state, orchestrates API calls, and wires UI interactions across search, sorting, pagination, and modal details.
- **Renders:** Page layout (`Header`, controls, `MovieList`, optional `MovieModal`, `Footer`).
- **Props:** None (top-level root component).
- **State:** Yes; owns movies data, query, page, selected movie, sort option, loading/error flags, and AI recommendation state.

#### `Header`
- **Responsibility:** Displays the app branding and top banner text.
- **Renders:** Title, short subtitle/tagline, optional decorative banner region.
- **Props:** `title: string`, `subtitle?: string`.
- **State:** No (presentational only).

#### `SearchBar`
- **Responsibility:** Captures user search input and exposes submit/clear actions.
- **Renders:** Text input, Search button, Clear button.
- **Props:**  
  - `query: string`  
  - `onQueryChange: (value: string) => void`  
  - `onSubmit: () => void`  
  - `onClear: () => void`  
  - `isLoading?: boolean`
- **State:** Optional local transient state (`draftQuery`) if debouncing is used; otherwise controlled by parent.

#### `SortControl`
- **Responsibility:** Lets users choose the sorting criterion for currently displayed movies.
- **Renders:** `<select>` dropdown with sort options.
- **Props:**  
  - `sortOption: 'title_asc' | 'release_desc' | 'vote_desc'`  
  - `onSortChange: (option) => void`
- **State:** No (controlled by `App`).

#### `MovieList`
- **Responsibility:** Displays a responsive movie grid and optional "Load More" action.
- **Renders:** Grid container of `MovieCard` items, empty state, load-more button.
- **Props:**  
  - `movies: MovieSummary[]`  
  - `onMovieClick: (movieId: number) => void`  
  - `onLoadMore: () => void`  
  - `showLoadMore: boolean`  
  - `isLoading: boolean`  
  - `errorMessage: string | null`
- **State:** No (presentational + events).

#### `MovieCard`
- **Responsibility:** Displays one movie preview and notifies parent when selected.
- **Renders:** Poster image, title, vote average, release date snippet.
- **Props:**  
  - `movie: MovieSummary`  
  - `onClick: (movieId: number) => void`
- **State:** No.

#### `MovieModal`
- **Responsibility:** Shows expanded details for the selected movie and AI recommendation output.
- **Renders:** Modal overlay, backdrop image, runtime, genres, release date, overview, AI recommendation block, close button.
- **Props:**  
  - `movieDetails: MovieDetails | null`  
  - `isOpen: boolean`  
  - `onClose: () => void`  
  - `aiRecommendation: string | null`  
  - `aiLoading: boolean`  
  - `aiError: string | null`
- **State:** May manage UI-only behavior like internal focus trap/escape key handling; data state stays in `App`.

#### `Footer`
- **Responsibility:** Displays attribution and footer metadata.
- **Renders:** Footer text, TMDb attribution note.
- **Props:** `year?: number`.
- **State:** No.

## 2) API Contracts

Base URL: `https://api.themoviedb.org/3`  
Authentication: API key passed as `api_key` query param (stored in `.env` as `VITE_TMDB_API_KEY`).

### A) Now Playing movies
- **Endpoint:** `GET https://api.themoviedb.org/3/movie/now_playing`
- **Required params:**  
  - `api_key` (string)  
  - `page` (number, default `1`)  
  - `language` (optional, default `en-US`)
- **Fields used by components:**  
  - `results[].id` (for card clicks + details lookup)  
  - `results[].title` (card title, search/sort)  
  - `results[].poster_path` (card poster image URL)  
  - `results[].vote_average` (card rating)  
  - `results[].release_date` (card metadata + sort)  
  - `total_pages` (pagination/load-more visibility)
- **Error cases to handle:**  
  - 401 invalid/missing API key -> show actionable error message.  
  - 429 rate-limited -> show retry guidance.  
  - Network failure/timeouts -> show fallback and retry affordance.  
  - Empty `results` -> show empty grid state.

### B) Search movies by title
- **Endpoint:** `GET https://api.themoviedb.org/3/search/movie`
- **Required params:**  
  - `api_key` (string)  
  - `query` (string, non-empty)  
  - `page` (number, default `1`)  
  - `include_adult` (boolean, optional)  
  - `language` (optional)
- **Fields used by components:**  
  - Same subset as Now Playing: `id`, `title`, `poster_path`, `vote_average`, `release_date`  
  - `total_pages` (search pagination)
- **Error cases to handle:**  
  - Empty query submission -> prevent request and keep current list.  
  - 401/429/network failures as above.  
  - Query returns zero results -> show "No matches found" empty state.

### C) Movie details for modal
- **Endpoint:** `GET https://api.themoviedb.org/3/movie/{movie_id}`
- **Required params:**  
  - `movie_id` path param (number, from clicked `MovieCard.id`)  
  - `api_key` (string)  
  - `language` (optional)
- **Fields used by components:**  
  - `id`  
  - `title`  
  - `runtime`  
  - `genres[].name`  
  - `overview`  
  - `release_date`  
  - `backdrop_path`  
  - `poster_path` (fallback image in modal)  
  - `vote_average`
- **Error cases to handle:**  
  - 404 movie not found (stale ID) -> close modal or show error in modal.  
  - 401/429/network failures -> show details fetch error state.  
  - Partial/null fields (e.g., missing runtime/backdrop) -> render safe fallback text/image.

## 3) State Architecture

All core state is owned by `App` unless noted.

- `movies: MovieSummary[]`  
  - **Initial:** `[]`  
  - **Owner:** `App`  
  - **Updates when:** now-playing/search fetch succeeds; sort option changes (derived reorder); clear search restores now-playing list.

- `searchQuery: string`  
  - **Initial:** `''`  
  - **Owner:** `App` (or controlled via `SearchBar`)  
  - **Updates when:** user types in search input, clear button clicked.

- `activeMode: 'now_playing' | 'search'`  
  - **Initial:** `'now_playing'`  
  - **Owner:** `App`  
  - **Updates when:** user submits a non-empty query (set to `'search'`); user clears/search resets to Now Playing (set to `'now_playing'`).

- `currentPage: number`  
  - **Initial:** `1`  
  - **Owner:** `App`  
  - **Updates when:** load-more clicked, new search started (reset to `1`), clear search (reset to `1`).

- `totalPages: number`  
  - **Initial:** `1`  
  - **Owner:** `App`  
  - **Updates when:** any list API response returns pagination metadata.

- `selectedMovieId: number | null`  
  - **Initial:** `null`  
  - **Owner:** `App`  
  - **Updates when:** user clicks a `MovieCard` (set ID), closes modal (set `null`).

- `selectedMovieDetails: MovieDetails | null`  
  - **Initial:** `null`  
  - **Owner:** `App`  
  - **Updates when:** details fetch succeeds for `selectedMovieId`; cleared on modal close.

- `sortOption: 'title_asc' | 'release_desc' | 'vote_desc'`  
  - **Initial:** `'title_asc'`  
  - **Owner:** `App`  
  - **Updates when:** user changes dropdown in `SortControl`.

- `isLoadingList: boolean`  
  - **Initial:** `false`  
  - **Owner:** `App`  
  - **Updates when:** now-playing/search/list pagination requests start/finish.

- `isLoadingDetails: boolean`  
  - **Initial:** `false`  
  - **Owner:** `App`  
  - **Updates when:** selected movie triggers details request start/finish.

- `listError: string | null`  
  - **Initial:** `null`  
  - **Owner:** `App`  
  - **Updates when:** list API requests fail; cleared on successful retry.

- `detailsError: string | null`  
  - **Initial:** `null`  
  - **Owner:** `App`  
  - **Updates when:** movie details request fails; cleared on next successful details fetch.

- `aiRecommendation: string | null`  
  - **Initial:** `null`  
  - **Owner:** `App` (passed to `MovieModal`)  
  - **Updates when:** AI recommendation call returns for selected movie; cleared when new movie selected.

- `isLoadingAi: boolean`  
  - **Initial:** `false`  
  - **Owner:** `App`  
  - **Updates when:** AI request starts/finishes.

- `aiError: string | null`  
  - **Initial:** `null`  
  - **Owner:** `App`  
  - **Updates when:** AI request fails; reset on retry/new movie selection.

## 4) Data Flow

`App` fetches movie lists from TMDb (Now Playing by default, or Search when a query is submitted), then normalizes each raw movie object into a `MovieSummary` shape used by UI (`id`, `title`, image paths, vote average, release date). When `activeMode` is `'search'`, the search endpoint is used with `searchQuery`; when `activeMode` is `'now_playing'`, the now-playing endpoint is used. Pagination uses `currentPage` and appends results for "Load More" instead of replacing existing items. `App` applies the selected sort option to that array and passes the sorted list to `MovieList`. `MovieList` maps each item to a `MovieCard` and forwards click events upward with `movie.id`. On card click, `App` stores `selectedMovieId`, opens `MovieModal`, and fetches `/movie/{movie_id}` details; the response is transformed into a `MovieDetails` object (including runtime and genre names) and passed into `MovieModal` for rendering.

Simple flow diagram:

`TMDb list endpoint -> App fetch/transform -> sorted movies state -> MovieList -> MovieCard`  
`MovieCard click(movieId) -> App selectedMovieId -> TMDb details endpoint -> App details state -> MovieModal`

## 5) AI Feature Spec (Milestone 8 Preview)

- **Display component:** `MovieModal` will render an "AI Watch Recommendation" section beneath movie overview/details.
- **AI input context:** `title`, `genres` (names), and `overview` from `selectedMovieDetails`.
- **AI task/output:** Return a concise 2-3 sentence recommendation explaining who might enjoy the movie and why, in plain language.
- **Role/task prompt shape:**  
  - Role: movie recommendation assistant.  
  - Task: produce brief, spoiler-free recommendation with confidence tone.  
  - Constraints: avoid fabricated plot details not present in context; max ~80 words.
- **State location:** `aiRecommendation`, `isLoadingAi`, and `aiError` live in `App` and are passed down to `MovieModal`.
- **Failure behavior:** If AI call fails or times out, modal shows a graceful fallback message such as "Recommendation unavailable right now. Please try again."
- **Trigger:** AI request starts after movie details are successfully loaded and modal is open.

