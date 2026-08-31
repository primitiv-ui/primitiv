/*
 * Type stub for `prism-react-renderer`, the syntax highlighter
 * `registry/components/code-block` imports.
 *
 * Why a stub and not the real package: only `apps/docs-site` installs it, and
 * that app is deliberately EXCLUDED from the pnpm workspace
 * (`!apps/docs-site` in pnpm-workspace.yaml) so it can install standalone
 * against the published packages. A root `pnpm install` therefore never
 * creates `apps/docs-site/node_modules`, and any tool that resolves through it
 * works only on a machine where that app happens to have been installed —
 * which is exactly how this broke in CI while passing locally.
 *
 * Stubbing is safe here because nothing prism-typed reaches a public API:
 * `code-block.tsx` imports only `Highlight` (used in its render body) and
 * `PrismTheme` (used for one internal const), so no exported `*Props` type
 * references anything declared below. The tools need the module to RESOLVE —
 * an unresolved import silently turns a props type into an error type, which
 * enumerates zero properties and emits an empty props table.
 *
 * Prop types are precise rather than a broad index signature, so the JSX
 * spreads in `code-block.tsx` still type-check against it.
 *
 * Shared by `scripts/check-registry-types.mjs` and
 * `scripts/docs-data/extract-docs-data.mjs` — one file, so a change here
 * cannot fix one caller and leave the other behind.
 */

import type { CSSProperties, ReactElement, ReactNode } from "react";

export interface PrismTheme {
  plain: object;
  styles: unknown[];
}

export interface Token {
  types: string[];
  content: string;
}

export interface LineOutputProps {
  style?: CSSProperties;
  className?: string;
}

export interface TokenOutputProps {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}

export interface RenderProps {
  className: string;
  style: CSSProperties;
  tokens: Token[][];
  getLineProps: (input: { line: Token[]; className?: string }) => LineOutputProps;
  getTokenProps: (input: { token: Token }) => TokenOutputProps;
}

export declare function Highlight(props: {
  theme?: PrismTheme;
  code: string;
  language: string;
  children: (props: RenderProps) => ReactNode;
}): ReactElement;
