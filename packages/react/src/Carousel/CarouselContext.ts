import { createContext, type Context } from "react";

import type { CarouselContextValue } from "./types";

export const CarouselContext: Context<CarouselContextValue | null> =
  createContext<CarouselContextValue | null>(null);

CarouselContext.displayName = "CarouselContext";

const CarouselProvider = CarouselContext.Provider;

export { CarouselProvider };
