import { ComponentProps, ReactNode, Ref } from "react";

export type InputProps = ComponentProps<"input"> & {
  asChild?: boolean;
  ref?: Ref<HTMLInputElement>;
  children?: ReactNode;
};
