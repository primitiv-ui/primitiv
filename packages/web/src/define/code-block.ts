/**
 * Side-effect entry: importing this module defines the Code Block element
 * (`<primitiv-code-block-copy>`) on the global `customElements` registry.
 *
 * ```html
 * <script type="module">import "@primitiv-ui/web/define/code-block";</script>
 * ```
 */
import { defineCodeBlock } from "../code-block/elements.ts";

defineCodeBlock();
