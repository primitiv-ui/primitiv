import { ComponentProps, ReactNode, Ref } from "react";

/**
 * Props for {@link InputGroup.Root} — all `<div>` attributes plus the
 * `asChild` escape hatch and a typed `ref`.
 */
export type InputGroupRootProps = ComponentProps<"div"> & {
  asChild?: boolean;
  ref?: Ref<HTMLDivElement>;
  children?: ReactNode;
};

/**
 * Props for {@link InputGroup.LeadingAdornment} and
 * {@link InputGroup.TrailingAdornment} — all `<span>` attributes plus the
 * `asChild` escape hatch and a typed `ref`.
 */
export type InputGroupAdornmentProps = ComponentProps<"span"> & {
  asChild?: boolean;
  ref?: Ref<HTMLSpanElement>;
  children?: ReactNode;
};
