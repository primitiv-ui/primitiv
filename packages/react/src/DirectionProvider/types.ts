import { ReactNode } from "react";

/** A reading direction — left-to-right or right-to-left. */
export type Direction = "ltr" | "rtl";

/** Props for {@link DirectionProvider} — the `dir` broadcast to descendants. */
export type DirectionProviderProps = {
  /** The reading direction broadcast to every descendant. */
  dir: Direction;
  children?: ReactNode;
};
