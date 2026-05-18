import { ReactElement } from "react";

export type AccessibleIconProps = {
  /** Text announced by assistive technology as the icon's accessible name. */
  label: string;
  /** A single icon element (e.g. an `<svg>`). */
  children: ReactElement;
};
