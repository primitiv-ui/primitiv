/**
 * Side-effect entry: importing this module defines the four Listbox elements
 * (`<primitiv-listbox>`, `-option`, `-group`, `-group-label`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/listbox";</script>
 * ```
 */
import { defineListbox } from "../listbox/elements.ts";

defineListbox();
