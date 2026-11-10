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
  PrimitivCollapsibleContentElement,
  PrimitivCollapsibleElement,
  PrimitivCollapsibleTriggerElement,
  PrimitivCollapsibleTriggerIconElement,
  PrimitivModalCloseElement,
  PrimitivModalContentElement,
  PrimitivModalDescriptionElement,
  PrimitivModalElement,
  PrimitivModalTitleElement,
  PrimitivModalTriggerElement,
  PrimitivPopoverAnchorElement,
  PrimitivPopoverCloseElement,
  PrimitivPopoverContentElement,
  PrimitivPopoverDescriptionElement,
  PrimitivPopoverElement,
  PrimitivPopoverTitleElement,
  PrimitivPopoverTriggerElement,
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

it("types every Collapsible tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-collapsible")).toEqualTypeOf<PrimitivCollapsibleElement | null>();
  expectTypeOf(document.createElement("primitiv-collapsible-trigger")).toEqualTypeOf<PrimitivCollapsibleTriggerElement>();
  expectTypeOf(document.createElement("primitiv-collapsible-content")).toEqualTypeOf<PrimitivCollapsibleContentElement>();
  expectTypeOf(document.createElement("primitiv-collapsible-trigger-icon")).toEqualTypeOf<PrimitivCollapsibleTriggerIconElement>();
});

it("types every Modal tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-modal")).toEqualTypeOf<PrimitivModalElement | null>();
  expectTypeOf(document.createElement("primitiv-modal-trigger")).toEqualTypeOf<PrimitivModalTriggerElement>();
  expectTypeOf(document.createElement("primitiv-modal-content")).toEqualTypeOf<PrimitivModalContentElement>();
  expectTypeOf(document.createElement("primitiv-modal-title")).toEqualTypeOf<PrimitivModalTitleElement>();
  expectTypeOf(document.createElement("primitiv-modal-description")).toEqualTypeOf<PrimitivModalDescriptionElement>();
  expectTypeOf(document.createElement("primitiv-modal-close")).toEqualTypeOf<PrimitivModalCloseElement>();
});

it("types every Popover tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-popover")).toEqualTypeOf<PrimitivPopoverElement | null>();
  expectTypeOf(document.createElement("primitiv-popover-trigger")).toEqualTypeOf<PrimitivPopoverTriggerElement>();
  expectTypeOf(document.createElement("primitiv-popover-anchor")).toEqualTypeOf<PrimitivPopoverAnchorElement>();
  expectTypeOf(document.createElement("primitiv-popover-content")).toEqualTypeOf<PrimitivPopoverContentElement>();
  expectTypeOf(document.createElement("primitiv-popover-title")).toEqualTypeOf<PrimitivPopoverTitleElement>();
  expectTypeOf(document.createElement("primitiv-popover-description")).toEqualTypeOf<PrimitivPopoverDescriptionElement>();
  expectTypeOf(document.createElement("primitiv-popover-close")).toEqualTypeOf<PrimitivPopoverCloseElement>();
});
