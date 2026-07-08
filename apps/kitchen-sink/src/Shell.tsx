import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { App } from "./App";
import { CarouselLayout } from "./pages/CarouselLayout";
import {
  CarouselDefault,
  CarouselResponsive,
  CarouselRtl,
  CarouselSquare,
  CarouselVertical,
  CarouselPeek,
  CarouselOverlay,
  CarouselFade,
} from "./pages/CarouselPage";
import "./Shell.css";

// The kitchen-sink is a single-page consumer demo, but a component with a large
// example set (Carousel) gets its own nested section: a sidebar of full-page
// examples under /carousel. `NavLink` sets aria-current="page" automatically.
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
        <Route path="/carousel" element={<CarouselLayout />}>
          <Route index element={<Navigate to="default" replace />} />
          <Route path="default" element={<CarouselDefault />} />
          <Route path="responsive" element={<CarouselResponsive />} />
          <Route path="rtl" element={<CarouselRtl />} />
          <Route path="square" element={<CarouselSquare />} />
          <Route path="vertical" element={<CarouselVertical />} />
          <Route path="peek" element={<CarouselPeek />} />
          <Route path="overlay" element={<CarouselOverlay />} />
          <Route path="fade" element={<CarouselFade />} />
        </Route>
      </Routes>
    </>
  );
}
