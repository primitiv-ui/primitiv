/**
 * Side-effect entry: importing this module defines the eleven Carousel
 * elements (`<primitiv-carousel>`, `-viewport`, `-track`, `-slide`,
 * `-previous-trigger`, `-next-trigger`, `-play-pause-trigger`,
 * `-indicator-group`, `-indicators`, `-indicator`, `-progress-text`) on the
 * global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/carousel";</script>
 * ```
 */
import { defineCarousel } from "../carousel/elements.ts";

defineCarousel();
