/**
 * Side-effect entry: importing this module defines the seven Popover elements
 * (`<primitiv-popover>`, `-trigger`, `-anchor`, `-content`, `-title`,
 * `-description`, `-close`) on the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/popover";</script>
 * ```
 */
import { definePopover } from "../popover/elements.ts";

definePopover();
