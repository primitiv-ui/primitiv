import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export type SkipNavLinkProps = {
  children?: ReactNode;
  contentId?: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export type SkipNavContentProps = {
  children?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;
