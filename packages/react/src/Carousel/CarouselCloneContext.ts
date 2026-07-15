import { createContext, type Context, type Provider } from "react";

/**
 * Marks the subtree it wraps as a **clone buffer** — the duplicate slides
 * the Viewport renders at each end for `loop="infinite"` so a native-scroll
 * wrap has real content to glide onto before the recentre teleport.
 *
 * Defaults to `false` (a normal, registering slide). Set to `true` by
 * `Carousel.Viewport` around the leading/trailing clone copies. A
 * `Carousel.Slide` reads it to skip self-registration (so the clones never
 * inflate the real slide count / indices / indicator dots / "x of n"
 * label) and to render itself inert + `aria-hidden` + out of the tab order.
 */
export const CarouselCloneContext: Context<boolean> =
  createContext<boolean>(false);

CarouselCloneContext.displayName = "CarouselCloneContext";

/** Provider for {@link CarouselCloneContext}; marks its subtree as clones. */
const CarouselCloneProvider: Provider<boolean> = CarouselCloneContext.Provider;

export { CarouselCloneProvider };
