/**
 * Side-effect entry: importing this module defines the two SplitButton
 * elements (`<primitiv-split-button>`, `-action`) on the global
 * `customElements` registry, and the Dropdown elements its menu is made of.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/split-button";</script>
 * ```
 */
import { defineSplitButton } from "../split-button/elements.ts";

defineSplitButton();
