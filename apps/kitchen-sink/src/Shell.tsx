import { NavLink, Route, Routes } from "react-router-dom";

import { App } from "./App";
import { CarouselPage } from "./pages/CarouselPage";
import "./Shell.css";

// The kitchen-sink is a single-page consumer demo, but a component with a large
// example set (Carousel) gets its own route. `NavLink` sets aria-current="page"
// on the active link automatically, which Shell.css styles.
export function Shell() {
  return (
    <>
      <nav className="ks-nav">
        <NavLink to="/" end>
          Kitchen Sink
        </NavLink>
        <NavLink to="/carousel">Carousel</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/carousel" element={<CarouselPage />} />
      </Routes>
    </>
  );
}
