import { ComponentProps, ReactNode, Ref } from "react";

export type InputGroupRootProps = ComponentProps<"div"> & {
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
};

export type InputGroupAdornmentProps = ComponentProps<"span"> & {
  ref?: Ref<HTMLSpanElement>;
  children?: ReactNode;
};
