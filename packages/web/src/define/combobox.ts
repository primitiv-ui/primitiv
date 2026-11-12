/**
 * Side-effect entry: importing this module defines the five Combobox elements
 * (`<primitiv-combobox>`, `-input`, `-content`, `-item`, `-empty`) on the
 * global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/combobox";</script>
 * ```
 */
import { defineCombobox } from "../combobox/elements.ts";

defineCombobox();
