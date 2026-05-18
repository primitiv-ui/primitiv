import { ComponentProps } from "react";

export type AlertProps = ComponentProps<"div"> & {
  asChild?: boolean;
};
