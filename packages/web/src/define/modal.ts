/**
 * Side-effect entry: importing this module defines the six Modal elements
 * (`<primitiv-modal>`, `-trigger`, `-content`, `-title`, `-description`,
 * `-close`) on the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/modal";</script>
 * ```
 */
import { defineModal } from "../modal/elements.ts";

defineModal();
