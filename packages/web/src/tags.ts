/**
 * Opt-in TypeScript tag map: bring this module into scope and DOM APIs return
 * the element classes for Primitiv's tags.
 *
 * ```ts
 * import type {} from "@primitiv-ui/web/tags";
 * document.querySelector("primitiv-tabs"); // PrimitivTabsElement | null
 * ```
 *
 * or list `"@primitiv-ui/web/tags"` in `compilerOptions.types`.
 *
 * It is a separate, npm-only entry because it augments a global type, which
 * JSR does not allow a published module to do (RFC 0033 §5.6.4).
 */
import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "./tabs/elements.ts";

declare global {
  interface HTMLElementTagNameMap {
    "primitiv-tabs": PrimitivTabsElement;
    "primitiv-tabs-list": PrimitivTabsListElement;
    "primitiv-tabs-trigger": PrimitivTabsTriggerElement;
    "primitiv-tabs-content": PrimitivTabsContentElement;
  }
}

export {};
