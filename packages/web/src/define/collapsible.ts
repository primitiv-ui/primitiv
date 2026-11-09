/**
 * Side-effect entry: importing this module defines the four Collapsible
 * elements (`<primitiv-collapsible>`, `-trigger`, `-content`, `-trigger-icon`)
 * on the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/collapsible";</script>
 * ```
 */
import { defineCollapsible } from "../collapsible/elements.ts";

defineCollapsible();
