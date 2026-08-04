import { ComponentProps, ReactNode, Ref } from "react";

export type SplitButtonRootProps = ComponentProps<"div"> & {
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

export type SplitButtonActionProps = ComponentProps<"button"> & {
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
};
