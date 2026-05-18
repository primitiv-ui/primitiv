import { ComponentProps } from "react";

export type StatusProps = ComponentProps<"div"> & {
  asChild?: boolean;
};
