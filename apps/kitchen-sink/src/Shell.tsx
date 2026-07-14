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
  CarouselExternalSplit,
  CarouselPlacement,
  CarouselSpacing,
  CarouselSize,
  CarouselImages,
  CarouselVariableWidth,
  CarouselProgress,
  CarouselSlideshow,
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="ks-header__logo"
          viewBox="0 0 100 100"
          aria-label="Primitiv"
          role="img"
        >
          <path
            fill="currentColor"
            d="M 11.00 77.50 L 16.99 67.14 L 22.97 77.50 Z
               M 19.91 62.08 L 29.04 46.28 L 47.08 77.50 L 28.82 77.50 Z
               M 31.96 41.22 L 50.00 10.00 L 89.00 77.50 L 52.92 77.50 Z"
          />
        </svg>
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
          <Route index element={<Navigate to="builder" replace />} />
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
          <Route path="external-split" element={<CarouselExternalSplit />} />
          <Route path="placement" element={<CarouselPlacement />} />
          <Route path="spacing" element={<CarouselSpacing />} />
          <Route path="size" element={<CarouselSize />} />
          <Route path="images" element={<CarouselImages />} />
          <Route path="variable-width" element={<CarouselVariableWidth />} />
          <Route path="progress" element={<CarouselProgress />} />
          <Route path="slideshow" element={<CarouselSlideshow />} />
        </Route>
      </Routes>
    </ChromeProvider>
  );
}
