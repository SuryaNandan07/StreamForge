import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  const isLoggedIn = Boolean(localStorage.getItem('streamforgeToken'));

  function handleLogout() {
    localStorage.removeItem('streamforgeToken');
    localStorage.removeItem('streamforgeUser');
    window.location.href = '/login';
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        StreamForge
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        {isLoggedIn ? (
          <button className="nav-button" type="button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
