import { CSSProperties } from "react";
import type { ReactElement } from "react";
import { Slot } from "../Slot/index.ts";
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
 * Renders a `<span>` carrying the canonical screen-reader-only clip styles
 * (WCAG 2.1 Technique C7): the content is removed from the visual layout but
 * still announced by assistive technology. Use it for text that gives a control
 * or region an accessible name without showing on screen.
 *
 * **Functional styles.** Unlike other `@primitiv-ui/react` components, the
 * clip styles are applied inline because they *are* the component's behaviour,
 * not decoration:
 *
 * ```css
 * position: absolute;
 * width: 1px; height: 1px;
 * padding: 0; margin: -1px;
 * overflow: hidden;
 * clip: rect(0 0 0 0);
 * clip-path: inset(50%);
 * white-space: nowrap;
 * border-width: 0;
 * ```
 *
 * A consumer `style` prop is merged on top, so any individual property can
 * still be overridden.
 *
 * **`asChild` composition.** Renders the consumer's element instead of a
 * `<span>`, merging the clip styles onto the child via the {@link Slot}
 * utility. Useful when the hidden content needs specific semantics (e.g. a
 * heading or landmark). The child must be a single React element.
 *
 * @extends HTMLSpanElement
 *
 * @example Accessible name for an icon-only button
 * ```tsx
 * <button>
 *   <SearchIcon aria-hidden="true" />
 *   <VisuallyHidden>Search</VisuallyHidden>
 * </button>
 * ```
 *
 * @example Region label hidden from sighted users
 * ```tsx
 * <nav aria-labelledby="nav-label">
 *   <VisuallyHidden id="nav-label">Primary navigation</VisuallyHidden>
 *   …
 * </nav>
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
}: VisuallyHiddenProps): ReactElement {
  const rootProps = {
    ...rest,
    style: { ...visuallyHiddenStyle, ...style },
  };

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }

  return <span {...rootProps}>{children}</span>;
}

/** @internal */
VisuallyHidden.displayName = "VisuallyHidden";
