import { useSyncExternalStore } from "react";

import { App } from "./App";
import { CarouselPage } from "./pages/CarouselPage";
import "./Shell.css";

// Dependency-free view switch: the kitchen-sink stays a single-page consumer
// demo, but a component with a large example set (Carousel) gets its own page
// off `#carousel`. No router — just the hash.
function useHash(): string {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("hashchange", onChange);
      return () => window.removeEventListener("hashchange", onChange);
    },
    () => window.location.hash,
    () => "",
  );
}

export function Shell() {
  const view = useHash() === "#carousel" ? "carousel" : "overview";
  return (
    <>
      <nav className="ks-nav">
        <a href="#" aria-current={view === "overview" ? "page" : undefined}>
          Kitchen Sink
        </a>
        <a
          href="#carousel"
          aria-current={view === "carousel" ? "page" : undefined}
        >
          Carousel
        </a>
      </nav>
      {view === "carousel" ? <CarouselPage /> : <App />}
    </>
  );
}
