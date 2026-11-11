/**
 * Side-effect entry: importing this module defines the three RadioCard
 * elements (`<primitiv-radio-card>`, `-item`, `-indicator`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/radio-card";</script>
 * ```
 */
import { defineRadioCard } from "../radio-card/elements.ts";

defineRadioCard();
