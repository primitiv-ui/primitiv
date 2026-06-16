import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Input} — all native `<input>` attributes plus the
 * `asChild` escape hatch and a typed `ref`.
 */
export type InputProps = ComponentProps<"input"> & {
  asChild?: boolean;
  ref?: Ref<HTMLInputElement>;
  children?: ReactNode;
};
