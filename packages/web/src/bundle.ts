/**
 * The single-file browser bundle (`dist/primitiv-web.js`, core inlined) for
 * pages with no build step:
 *
 * ```html
 * <script type="module" src="https://cdn.jsdelivr.net/npm/@primitiv-ui/web@<version>/dist/primitiv-web.js"></script>
 * ```
 *
 * Loading it defines every element and exports every class.
 */
export * from "./index.ts";
import "./define/index.ts";
