/**
 * Side-effect entry: importing this module defines the two CheckboxCard
 * elements (`<primitiv-checkbox-card>`, `-indicator`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/checkbox-card";</script>
 * ```
 */
import { defineCheckboxCard } from "../checkbox-card/elements.ts";

defineCheckboxCard();
