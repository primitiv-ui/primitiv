import { ReactElement } from "react";

/**
 * Props for {@link AccessibleIcon} — a single icon element plus the
 * visually-hidden `label` announced as its accessible name.
 */
export type AccessibleIconProps = {
  /** Text announced by assistive technology as the icon's accessible name. */
  label: string;
  /** A single icon element (e.g. an `<svg>`). */
  children: ReactElement;
};
