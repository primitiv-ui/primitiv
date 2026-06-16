import { ComponentProps } from "react";

/** Props for the `Alert` — a live-region `<div role="alert">`; native `<div>` props plus `asChild`. */
export type AlertProps = ComponentProps<"div"> & {
  asChild?: boolean;
};
