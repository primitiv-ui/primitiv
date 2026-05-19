import { ComponentProps, ReactNode, Ref } from "react";

export type TextareaProps = ComponentProps<"textarea"> & {
  asChild?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
  children?: ReactNode;
};
