/**
 * Side-effect entry: importing this module defines the eight Navigation Menu
 * elements (`<primitiv-navigation-menu>`, `-list`, `-item`, `-trigger`,
 * `-content`, `-viewport`, `-indicator`, `-link`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/navigation-menu";</script>
 * ```
 */
import { defineNavigationMenu } from "../navigation-menu/elements.ts";

defineNavigationMenu();
