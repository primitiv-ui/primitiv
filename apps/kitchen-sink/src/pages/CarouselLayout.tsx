import { NavLink, Outlet } from "react-router-dom";

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
];

export function CarouselLayout() {
  return (
    <div className="carousel-layout">
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
