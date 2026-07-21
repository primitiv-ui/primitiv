import type { ReactPortal } from "react";
import { createPortal } from "react-dom";

import type { PortalProps } from "./types";

/**
 * Teleports its children into a DOM node outside the current React subtree
 * using React's `createPortal`. Renders no host element of its own — the
 * children appear directly inside the target `container`.
 *
 * Use `Portal` whenever a subtree must escape its ancestor's stacking context,
 * overflow clipping, or z-index hierarchy — tooltips, modals, dropdowns, and
 * similar overlays are the typical cases. `Portal` carries no state, context,
 * or open/close awareness; those concerns belong in the composing component
 * (see `Modal.Portal`, which layers open-state suppression and `forceMount` on
 * top of this primitive).
 *
 * **Conditional rendering.** `Portal` always mounts when rendered. To control
 * visibility, conditionally render the `Portal` itself, or manage show/hide
 * logic in the composing component:
 *
 * ```tsx
 * {isOpen && (
 *   <Portal>
 *     <div role="dialog">…</div>
 *   </Portal>
 * )}
 * ```
 *
 * For CSS-driven exit animations, keep the portal mounted and drive styles
 * through a `data-state` attribute on its child:
 *
 * ```tsx
 * <Portal>
 *   <div data-state={isOpen ? "open" : "closed"}>…</div>
 * </Portal>
 * ```
 *
 * **Ref forwarding.** `Portal` does not forward a ref (there is no host
 * element to attach one to). Attach `ref` directly to the child element
 * rendered inside the portal.
 *
 * @example Mount into document.body (default)
 * ```tsx
 * import { Portal } from "@primitiv-ui/react";
 *
 * <Portal>
 *   <div role="dialog" aria-modal="true">
 *     Modal content rendered directly in document.body
 *   </div>
 * </Portal>
 * ```
 *
 * @example Mount into a custom container
 * ```tsx
 * const overlayRoot = document.getElementById("overlay-root");
 *
 * <Portal container={overlayRoot}>
 *   <div role="tooltip">Tooltip content</div>
 * </Portal>
 * ```
 */
function Portal({ children, container }: PortalProps): ReactPortal {
  return createPortal(children, container ?? document.body);
}

/** @internal */
Portal.displayName = "Portal";

export { Portal };
