/**
 * Side-effect entry: importing this module defines the five Accordion elements
 * (`<primitiv-accordion>`, `-item`, `-trigger`, `-content`, `-trigger-icon`) on
 * the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/accordion";</script>
 * ```
 */
import { defineAccordion } from "../accordion/elements.ts";

defineAccordion();
