/**
 * Side-effect entry: importing this module defines the four Tabs elements
 * (`<primitiv-tabs>`, `-list`, `-trigger`, `-content`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/tabs";</script>
 * ```
 */
import { defineTabs } from "../tabs/elements.ts";

defineTabs();
