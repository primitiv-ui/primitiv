import { ReactElement } from "react";

/**
 * Props for {@link AccessibleIcon} — a single icon element plus the
 * visually-hidden `label` announced as its accessible name.
 *
 * `AccessibleIconProps` does not extend any HTML element props: the
 * component renders a React fragment with no host element of its own.
 */
export type AccessibleIconProps = {
  /**
   * Text announced by assistive technology as the accessible name of the
   * surrounding interactive control. Keep it concise and action-oriented
   * (e.g. `"Close dialog"`, `"Go to home page"`). This string is rendered
   * inside a {@link VisuallyHidden} span — it is never visible on screen.
   */
  label: string;
  /**
   * Exactly one React element representing the icon (typically an `<svg>`
   * or a component that renders one). The element is cloned with
   * `aria-hidden="true"` and `focusable="false"` applied. Passing zero,
   * multiple, or a non-element child throws a React `Children.only` error.
   */
  children: ReactElement;
};
