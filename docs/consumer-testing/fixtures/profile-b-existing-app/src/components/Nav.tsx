import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <header className="nf-nav">
      <div className="nf-nav__brand">Northfield &amp; Co.</div>
      <nav className="nf-nav__links">
        <NavLink to="/" end className="nf-nav__link">
          Home
        </NavLink>
        <NavLink to="/services" className="nf-nav__link">
          Services
        </NavLink>
        <NavLink to="/about" className="nf-nav__link">
          About
        </NavLink>
      </nav>
    </header>
  );
}
