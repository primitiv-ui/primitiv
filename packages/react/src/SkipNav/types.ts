import type { AnchorHTMLAttributes, ReactNode } from "react";

export type SkipNavLinkProps = {
  children?: ReactNode;
} & AnchorHTMLAttributes<HTMLAnchorElement>;
