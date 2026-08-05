import type { HTMLAttributes, ReactNode, Ref } from "react";

/** Props for `Listbox.Root`. */
export type ListboxRootProps = HTMLAttributes<HTMLDivElement> & {
  type: "single";
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};

/** Props for `Listbox.Option`. */
export type ListboxOptionProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  value: string;
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
};
