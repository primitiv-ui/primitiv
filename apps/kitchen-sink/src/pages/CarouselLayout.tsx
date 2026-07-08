import { NavLink, Outlet } from "react-router-dom";

import { ChromeControls } from "../chrome";
import "./CarouselLayout.css";

// Each example is a full-page nested route; the sidebar switches between them.
// New examples land here as we work through the backlog.
const EXAMPLES: { to: string; label: string }[] = [
  { to: "default", label: "Default" },
  { to: "responsive", label: "Container adaptation" },
  { to: "rtl", label: "RTL" },
  { to: "square", label: "Square slides" },
  { to: "vertical", label: "Vertical" },
  { to: "peek", label: "Peek" },
  { to: "overlay", label: "Overlay" },
  { to: "fade", label: "Fade" },
];

export function CarouselLayout() {
  return (
    <div className="carousel-layout">
      <header className="carousel-layout__chrome">
        <ChromeControls />
      </header>

      <div className="carousel-layout__body">
        <aside className="carousel-layout__sidebar">
          <p className="carousel-layout__eyebrow">Carousel</p>
          <nav className="carousel-layout__nav" aria-label="Carousel examples">
            {EXAMPLES.map(({ to, label }) => (
              <NavLink key={to} to={to} className="carousel-layout__link">
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="carousel-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
