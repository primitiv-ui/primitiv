import { ReactNode } from "react";

/**
 * Props for {@link Portal} — the `children` to teleport and an optional
 * `container` to render into (defaults to `document.body`).
 */
export type PortalProps = {
  /** Content to render inside the portal. Appears directly inside `container`
   * with no wrapping host element added by `Portal` itself. */
  children?: ReactNode;
  /** DOM node to mount the portal children into. When omitted, children are
   * mounted into `document.body`.
   * @default document.body */
  container?: HTMLElement;
};
