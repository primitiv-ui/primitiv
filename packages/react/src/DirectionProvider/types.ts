import { ReactNode } from "react";

/** A reading direction — left-to-right or right-to-left. */
export type Direction = "ltr" | "rtl";

export type DirectionProviderProps = {
  /** The reading direction broadcast to every descendant. */
  dir: Direction;
  children?: ReactNode;
};
