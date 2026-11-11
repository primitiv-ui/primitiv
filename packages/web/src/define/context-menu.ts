/**
 * Side-effect entry: importing this module defines the fourteen Context Menu
 * elements (`<primitiv-context-menu>`, `-trigger`, `-content`, the items,
 * groups, label, separator and indicator, and the `-sub` parts) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/context-menu";</script>
 * ```
 */
import { defineContextMenu } from "../context-menu/elements.ts";

defineContextMenu();
