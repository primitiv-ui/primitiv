import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link Button} — all native `<button>` attributes (with `type`
 * defaulting to `"button"`) plus the `asChild` escape hatch and a typed `ref`.
 */
export type ButtonProps = Omit<ComponentProps<"button">, "type"> & {
  type?: "button" | "submit" | "reset";
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
  children?: ReactNode;
};
