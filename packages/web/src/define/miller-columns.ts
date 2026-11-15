/**
 * Side-effect entry: importing this module defines the seven Miller Columns
 * elements (`<primitiv-miller-columns>`, `-tree`, `-column`, `-item`,
 * `-item-indicator`, `-resize-handle`, `-preview-panel`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/miller-columns";</script>
 * ```
 */
import { defineMillerColumns } from "../miller-columns/elements.ts";

defineMillerColumns();
