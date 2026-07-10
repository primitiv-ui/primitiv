import { NavLink, Navigate, Route, Routes } from "react-router-dom";

import { App } from "./App";
import { ChromeProvider, ChromeControls } from "./chrome";
import { CarouselBuilder } from "./pages/CarouselBuilder";
import { CarouselLayout } from "./pages/CarouselLayout";
import {
  CarouselDefault,
  CarouselResponsive,
  CarouselRtl,
  CarouselSquare,
  CarouselVertical,
  CarouselPeek,
  CarouselPadding,
  CarouselMulti,
  CarouselOverlay,
  CarouselFade,
  CarouselThumbnails,
  CarouselRatio,
  CarouselFlank,
  CarouselPlacement,
  CarouselSpacing,
} from "./pages/CarouselPage";
import "./Shell.css";

// The kitchen-sink is a single-page consumer demo, but a component with a large
// example set (Carousel) gets its own nested section: a sidebar of full-page
// examples under /carousel. `NavLink` sets aria-current="page" automatically.
//
// The density / size / theme controls live in one full-width sticky header at
// the top of the shell (ChromeProvider owns the state), so they persist across
// every route; the page nav sits just below it.
export function Shell() {
  return (
    <ChromeProvider>
      <header className="ks-header">
        <ChromeControls />
      </header>
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
          <Route path="builder" element={<CarouselBuilder />} />
          <Route path="default" element={<CarouselDefault />} />
          <Route path="responsive" element={<CarouselResponsive />} />
          <Route path="rtl" element={<CarouselRtl />} />
          <Route path="square" element={<CarouselSquare />} />
          <Route path="vertical" element={<CarouselVertical />} />
          <Route path="peek" element={<CarouselPeek />} />
          <Route path="padding" element={<CarouselPadding />} />
          <Route path="multi" element={<CarouselMulti />} />
          <Route path="overlay" element={<CarouselOverlay />} />
          <Route path="fade" element={<CarouselFade />} />
          <Route path="thumbnails" element={<CarouselThumbnails />} />
          <Route path="ratio" element={<CarouselRatio />} />
          <Route path="flank" element={<CarouselFlank />} />
          <Route path="placement" element={<CarouselPlacement />} />
          <Route path="spacing" element={<CarouselSpacing />} />
        </Route>
      </Routes>
    </ChromeProvider>
  );
}
