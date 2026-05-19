import { ComponentProps, Ref } from "react";

export type TextareaProps = ComponentProps<"textarea"> & {
  ref?: Ref<HTMLTextAreaElement>;
};
