/**
 * Side-effect entry: importing this module defines the two SegmentedControl
 * elements (`<primitiv-segmented-control>`, `-item`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/segmented-control";</script>
 * ```
 */
import { defineSegmentedControl } from "../segmented-control/elements.ts";

defineSegmentedControl();
