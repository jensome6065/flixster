import PropTypes from 'prop-types'
import './Sidebar.css'

const SidebarList = ({ title, movies, emptyMessage }) => (
  <section className="sidebar__section" aria-label={title}>
    <div className="sidebar__section-header">
      <h2 className="sidebar__title">{title}</h2>
      <span className="sidebar__count">{movies.length}</span>
    </div>
    {movies.length === 0 ? (
      <p className="sidebar__empty">{emptyMessage}</p>
    ) : (
      <ul className="sidebar__list">
        {movies.map((movie) => (
          <li key={movie.id} className="sidebar__item">
            <span className="sidebar__item-title">{movie.title}</span>
            <span className="sidebar__item-date">{movie.release_date || 'Date unavailable'}</span>
          </li>
        ))}
      </ul>
    )}
  </section>
)

SidebarList.propTypes = {
  title: PropTypes.string.isRequired,
  movies: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    release_date: PropTypes.string,
  })).isRequired,
  emptyMessage: PropTypes.string.isRequired,
}

const Sidebar = ({ favoritedMovies, watchedMovies }) => (
  <aside className="sidebar" aria-label="Movie Lists">
    <SidebarList
      title="Favorited Movies"
      movies={favoritedMovies}
      emptyMessage="No favorites yet."
    />
    <SidebarList
      title="Watched List"
      movies={watchedMovies}
      emptyMessage="No watched movies yet."
    />
  </aside>
)

Sidebar.propTypes = {
  favoritedMovies: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    release_date: PropTypes.string,
  })).isRequired,
  watchedMovies: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    release_date: PropTypes.string,
  })).isRequired,
}

export default Sidebar
