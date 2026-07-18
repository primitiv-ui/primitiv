import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import "./CarouselLayout.css";

// Each example is a full-page nested route; the sidebar switches between them.
// New examples land here as we work through the backlog.
const EXAMPLES: { to: string; label: string }[] = [
  { to: "builder", label: "Builder" },
  { to: "default", label: "Default" },
  { to: "responsive", label: "Container adaptation" },
  { to: "rtl", label: "RTL" },
  { to: "square", label: "Square slides" },
  { to: "vertical", label: "Vertical" },
  { to: "peek", label: "Peek" },
  { to: "padding", label: "Viewport padding" },
  { to: "multi", label: "Multi-slide" },
  { to: "overlay", label: "Overlay" },
  { to: "fade", label: "Fade" },
  { to: "thumbnails", label: "Thumbnails" },
  { to: "ratio", label: "Ratio" },
  { to: "external-split", label: "External-split" },
  { to: "placement", label: "Control placement" },
  { to: "spacing", label: "Slide spacing" },
  { to: "size", label: "Size" },
  { to: "images", label: "Images" },
  { to: "variable-width", label: "Variable width" },
  { to: "progress", label: "Scroll progress" },
  { to: "slideshow", label: "Slideshow (parallax)" },
  { to: "coverflow", label: "Cover Flow" },
  { to: "loop", label: "Loop" },
];

export function CarouselLayout() {
  // On narrow screens the 14rem examples column would swallow the page, so it
  // folds into a slide-in drawer behind a toggle button (mirrors the workbench
  // sidebar). Close it on every route change so tapping an example link doesn't
  // leave the drawer hanging open over the page.
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);
  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="carousel-layout">
      <div className="carousel-layout__bar">
        <button
          type="button"
          className="carousel-layout__toggle"
          aria-label={isNavOpen ? "Close examples" : "Open examples"}
          aria-expanded={isNavOpen}
          aria-controls="carousel-examples"
          onClick={() => setIsNavOpen((open) => !open)}
        >
          <span className="carousel-layout__toggle-icon" aria-hidden="true" />
          Examples
        </button>
      </div>
      {isNavOpen && (
        <button
          type="button"
          className="carousel-layout__backdrop"
          aria-label="Close examples"
          tabIndex={-1}
          onClick={() => setIsNavOpen(false)}
        />
      )}
      <div className="carousel-layout__body">
        <aside
          id="carousel-examples"
          className={
            isNavOpen
              ? "carousel-layout__sidebar carousel-layout__sidebar--open"
              : "carousel-layout__sidebar"
          }
        >
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
