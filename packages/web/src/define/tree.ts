/**
 * Side-effect entry: importing this module defines the seven Tree elements
 * (`<primitiv-tree>`, `-item`, `-branch`, `-branch-control`, `-branch-content`,
 * `-branch-indicator`, `-selection-path`) on the global `customElements`
 * registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/tree";</script>
 * ```
 */
import { defineTree } from "../tree/elements.ts";

defineTree();
