import { Link, NavLink } from 'react-router-dom';

function Navbar() {
  return (
    <header className="navbar">
      <Link className="brand" to="/">
        StreamForge
      </Link>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/watch">Watch</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/login">Login</NavLink>
        <NavLink to="/register">Register</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
