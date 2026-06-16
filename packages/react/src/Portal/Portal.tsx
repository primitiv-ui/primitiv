import type { ReactPortal } from "react";
import { createPortal } from "react-dom";

import type { PortalProps } from "./types";

/**
 * Renders children outside the current React subtree by mounting them into a
 * DOM node via `createPortal`. Defaults to `document.body`; pass `container`
 * to target a different element.
 *
 * @example
 * // Mount into document.body (default)
 * <Portal>
 *   <div role="dialog">…</div>
 * </Portal>
 *
 * @example
 * // Mount into a specific container
 * <Portal container={document.getElementById("overlays")}>
 *   <div role="dialog">…</div>
 * </Portal>
 */
function Portal({ children, container }: PortalProps): ReactPortal {
  return createPortal(children, container ?? document.body);
}

/** @internal */
Portal.displayName = "Portal";

export { Portal };
