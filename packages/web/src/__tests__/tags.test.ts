// The opt-in tag map: with `@primitiv-ui/web/tags` in scope, DOM queries and
// `createElement` return the element classes rather than a bare Element. The
// assertions are checked by `pnpm typecheck`; at runtime they are no-ops.
import "../tags";

import type {
  PrimitivAccordionContentElement,
  PrimitivAccordionElement,
  PrimitivAccordionItemElement,
  PrimitivAccordionTriggerElement,
  PrimitivAccordionTriggerIconElement,
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "../index";

it("types every Tabs tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-tabs")).toEqualTypeOf<PrimitivTabsElement | null>();
  expectTypeOf(document.createElement("primitiv-tabs-list")).toEqualTypeOf<PrimitivTabsListElement>();
  expectTypeOf(document.createElement("primitiv-tabs-trigger")).toEqualTypeOf<PrimitivTabsTriggerElement>();
  expectTypeOf(document.createElement("primitiv-tabs-content")).toEqualTypeOf<PrimitivTabsContentElement>();
});

it("types every Accordion tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-accordion")).toEqualTypeOf<PrimitivAccordionElement | null>();
  expectTypeOf(document.createElement("primitiv-accordion-item")).toEqualTypeOf<PrimitivAccordionItemElement>();
  expectTypeOf(document.createElement("primitiv-accordion-trigger")).toEqualTypeOf<PrimitivAccordionTriggerElement>();
  expectTypeOf(document.createElement("primitiv-accordion-content")).toEqualTypeOf<PrimitivAccordionContentElement>();
  expectTypeOf(
    document.createElement("primitiv-accordion-trigger-icon"),
  ).toEqualTypeOf<PrimitivAccordionTriggerIconElement>();
});
