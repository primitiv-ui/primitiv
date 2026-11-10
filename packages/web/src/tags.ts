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
  PrimitivAccordionContentElement,
  PrimitivAccordionElement,
  PrimitivAccordionItemElement,
  PrimitivAccordionTriggerElement,
  PrimitivAccordionTriggerIconElement,
} from "./accordion/elements.ts";
import type {
  PrimitivCollapsibleContentElement,
  PrimitivCollapsibleElement,
  PrimitivCollapsibleTriggerElement,
  PrimitivCollapsibleTriggerIconElement,
} from "./collapsible/elements.ts";
import type {
  PrimitivModalCloseElement,
  PrimitivModalContentElement,
  PrimitivModalDescriptionElement,
  PrimitivModalElement,
  PrimitivModalTitleElement,
  PrimitivModalTriggerElement,
} from "./modal/elements.ts";
import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "./tabs/elements.ts";

declare global {
  interface HTMLElementTagNameMap {
    "primitiv-accordion": PrimitivAccordionElement;
    "primitiv-accordion-item": PrimitivAccordionItemElement;
    "primitiv-accordion-trigger": PrimitivAccordionTriggerElement;
    "primitiv-accordion-content": PrimitivAccordionContentElement;
    "primitiv-accordion-trigger-icon": PrimitivAccordionTriggerIconElement;
    "primitiv-collapsible": PrimitivCollapsibleElement;
    "primitiv-collapsible-trigger": PrimitivCollapsibleTriggerElement;
    "primitiv-collapsible-content": PrimitivCollapsibleContentElement;
    "primitiv-collapsible-trigger-icon": PrimitivCollapsibleTriggerIconElement;
    "primitiv-modal": PrimitivModalElement;
    "primitiv-modal-trigger": PrimitivModalTriggerElement;
    "primitiv-modal-content": PrimitivModalContentElement;
    "primitiv-modal-title": PrimitivModalTitleElement;
    "primitiv-modal-description": PrimitivModalDescriptionElement;
    "primitiv-modal-close": PrimitivModalCloseElement;
    "primitiv-tabs": PrimitivTabsElement;
    "primitiv-tabs-list": PrimitivTabsListElement;
    "primitiv-tabs-trigger": PrimitivTabsTriggerElement;
    "primitiv-tabs-content": PrimitivTabsContentElement;
  }
}

export {};
