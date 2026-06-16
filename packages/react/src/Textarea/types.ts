import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Textarea} — all native `<textarea>` attributes plus the
 * `asChild` escape hatch and a typed `ref`.
 */
export type TextareaProps = ComponentProps<"textarea"> & {
  asChild?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
  children?: ReactNode;
};
