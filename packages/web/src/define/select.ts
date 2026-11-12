/**
 * Side-effect entry: importing this module defines the eight Select elements
 * (`<primitiv-select>`, `-trigger`, `-value`, `-content`, `-item`,
 * `-item-indicator`, `-group`, `-separator`) on the global `customElements`
 * registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/select";</script>
 * ```
 */
import { defineSelect } from "../select/elements.ts";

defineSelect();
