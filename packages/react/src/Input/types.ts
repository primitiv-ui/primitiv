import { ComponentProps, Ref } from "react";

export type InputProps = ComponentProps<"input"> & {
  ref?: Ref<HTMLInputElement>;
};
