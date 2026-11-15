/**
 * Side-effect entry: importing this module defines the four Stepper elements
 * (`<primitiv-stepper>`, `-list`, `-step`, `-panel`) on the global
 * `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/stepper";</script>
 * ```
 */
import { defineStepper } from "../stepper/elements.ts";

defineStepper();
