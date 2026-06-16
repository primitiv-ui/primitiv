import { ReactNode } from "react";

/**
 * Props for {@link Portal} — the `children` to teleport and an optional
 * `container` to render into (defaults to `document.body`).
 */
export type PortalProps = {
  children?: ReactNode;
  container?: HTMLElement;
};
