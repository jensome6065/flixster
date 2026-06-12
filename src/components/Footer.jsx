import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="app-footer">
      <p>
        © {currentYear} Flixster. Movie data provided by{' '}
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noreferrer"
        >
          TMDb
        </a>
        .
      </p>
    </footer>
  )
}

export default Footer
