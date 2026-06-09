import { CSSProperties } from "react";
import { Slot } from "../Slot";
import { VisuallyHiddenProps } from "./types";

const visuallyHiddenStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  borderWidth: 0,
};

/**
 * Visually hides its children while keeping them in the accessibility tree.
 *
 * Renders a `<span>` carrying the canonical screen-reader-only clip styles:
 * the content is removed from the visual layout but still announced by
 * assistive technology. Use it for text that gives a control or region an
 * accessible name without showing on screen.
 *
 * **Functional styles.** Unlike other `@primitiv-ui/react` components, the
 * clip styles are applied inline because they *are* the component's
 * behaviour, not decoration. A consumer `style` is merged on top, so any
 * individual property can still be overridden.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<span>`, merging the clip styles in via the {@link Slot} utility.
 *
 * @example Accessible name for an icon-only button
 * ```tsx
 * <button>
 *   <SearchIcon aria-hidden="true" />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 * ```
 *
 * @example asChild — keep semantic markup hidden
 * ```tsx
 * <VisuallyHidden asChild>
 *   <h2>Section heading</h2>
 * </VisuallyHidden>
 * ```
 */
export function VisuallyHidden({
  asChild = false,
  children,
  style,
  ...rest
}: VisuallyHiddenProps) {
  const rootProps = {
    ...rest,
    style: { ...visuallyHiddenStyle, ...style },
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <span {...rootProps}>{children}</span>;
}

VisuallyHidden.displayName = "VisuallyHidden";
