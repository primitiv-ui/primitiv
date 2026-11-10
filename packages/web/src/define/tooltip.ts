/**
 * Side-effect entry: importing this module defines the five Tooltip elements
 * (`<primitiv-tooltip>`, `-provider`, `-trigger`, `-content`, `-arrow`) on the
 * global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/tooltip";</script>
 * ```
 */
import { defineTooltip } from "../tooltip/elements.ts";

defineTooltip();
