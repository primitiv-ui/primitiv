/**
 * Side-effect entry: importing this module defines the two ToggleGroup elements
 * (`<primitiv-toggle-group>`, `-item`) on the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/toggle-group";</script>
 * ```
 */
import { defineToggleGroup } from "../toggle-group/elements.ts";

defineToggleGroup();
