import { createContext, type Context, type Provider } from "react";

import type { CarouselContextValue } from "./types";

/** React context carrying the {@link CarouselContextValue} shared by the carousel's sub-components. */
export const CarouselContext: Context<CarouselContextValue | null> =
  createContext<CarouselContextValue | null>(null);

CarouselContext.displayName = "CarouselContext";

/** Provider for {@link CarouselContext}; wraps the carousel subtree with its shared state. */
const CarouselProvider: Provider<CarouselContextValue | null> =
  CarouselContext.Provider;

export { CarouselProvider };
