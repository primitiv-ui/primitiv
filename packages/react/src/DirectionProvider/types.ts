import { ReactNode } from "react";

/**
 * A reading direction value — left-to-right or right-to-left.
 *
 * Used as the {@link DirectionProviderProps.dir | `dir`} prop on
 * {@link DirectionProvider} and as the `dir` prop accepted by every
 * direction-aware component (e.g. `Tabs.Root`, `Slider.Root`).
 * {@link useDirection} returns this type.
 */
export type Direction = "ltr" | "rtl";

/**
 * Props for {@link DirectionProvider} — the reading direction broadcast to
 * all descendant components.
 *
 * `DirectionProvider` accepts no native HTML element props: it renders no
 * DOM host element and is a pure React context provider.
 */
export type DirectionProviderProps = {
  /**
   * The reading direction to broadcast to every descendant.
   * See {@link Direction}.
   *
   * Direction-aware components (e.g. `Tabs.Root`, `Slider.Root`) read
   * this value via {@link useDirection} when their own `dir` prop is
   * omitted. An explicit `dir` prop on a descendant always takes
   * precedence over the inherited value.
   */
  dir: Direction;
  /**
   * The subtree whose direction-aware components will inherit `dir`.
   * Any React content is accepted; there is no DOM wrapper.
   */
  children?: ReactNode;
};
