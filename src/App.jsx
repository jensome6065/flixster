import './App.css'
import MovieCard from './components/MovieCard'

const sampleMovie = {
  id: 603,
  title: 'The Matrix',
  poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
  vote_average: 8.2,
  release_date: '1999-03-31',
}

const App = () => {
  const handleMovieClick = (movieId) => {
    console.log(`Selected movie id: ${movieId}`)
  }

  return (
    <div className="App">
      <h1>Flixster</h1>
      <div className="movie-grid">
        <MovieCard movie={sampleMovie} onClick={handleMovieClick} />
      </div>
    </div>
  )
}

export default App
