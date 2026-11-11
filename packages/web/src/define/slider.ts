/**
 * Side-effect entry: importing this module defines the four Slider elements
 * (`<primitiv-slider>`, `-track`, `-range`, `-thumb`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/slider";</script>
 * ```
 */
import { defineSlider } from "../slider/elements.ts";

defineSlider();
