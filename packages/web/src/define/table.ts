/**
 * Side-effect entry: importing this module defines the Table element
 * (`<primitiv-table-expand-trigger>`) on the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/table";</script>
 * ```
 */
import { defineTable } from "../table/elements.ts";

defineTable();
