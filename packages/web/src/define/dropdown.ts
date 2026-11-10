/**
 * Side-effect entry: importing this module defines the fourteen Dropdown
 * elements (`<primitiv-dropdown>`, `-trigger`, `-content`, the items, groups,
 * label, separator and indicator, and the `-sub` parts) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/dropdown";</script>
 * ```
 */
import { defineDropdown } from "../dropdown/elements.ts";

defineDropdown();
