import { ComponentProps } from "react";

export type VisuallyHiddenProps = ComponentProps<"span"> & {
  asChild?: boolean;
};
