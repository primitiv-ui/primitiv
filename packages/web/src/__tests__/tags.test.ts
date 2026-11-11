// The opt-in tag map: with `@primitiv-ui/web/tags` in scope, DOM queries and
// `createElement` return the element classes rather than a bare Element. The
// assertions are checked by `pnpm typecheck`; at runtime they are no-ops.
import "../tags";

import type {
  PrimitivContextMenuCheckboxItemElement,
  PrimitivContextMenuContentElement,
  PrimitivContextMenuElement,
  PrimitivContextMenuGroupElement,
  PrimitivContextMenuItemElement,
  PrimitivContextMenuItemIndicatorElement,
  PrimitivContextMenuLabelElement,
  PrimitivContextMenuRadioGroupElement,
  PrimitivContextMenuRadioItemElement,
  PrimitivContextMenuSeparatorElement,
  PrimitivContextMenuSubContentElement,
  PrimitivContextMenuSubElement,
  PrimitivContextMenuSubTriggerElement,
  PrimitivContextMenuTriggerElement,
  PrimitivDropdownCheckboxItemElement,
  PrimitivDropdownContentElement,
  PrimitivDropdownElement,
  PrimitivDropdownGroupElement,
  PrimitivDropdownItemElement,
  PrimitivDropdownItemIndicatorElement,
  PrimitivDropdownLabelElement,
  PrimitivDropdownRadioGroupElement,
  PrimitivDropdownRadioItemElement,
  PrimitivDropdownSeparatorElement,
  PrimitivDropdownSubContentElement,
  PrimitivDropdownSubElement,
  PrimitivDropdownSubTriggerElement,
  PrimitivDropdownTriggerElement,
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
  PrimitivTooltipArrowElement,
  PrimitivTooltipContentElement,
  PrimitivTooltipElement,
  PrimitivTooltipProviderElement,
  PrimitivTooltipTriggerElement,
  PrimitivCheckboxCardElement,
  PrimitivCheckboxCardIndicatorElement,
  PrimitivRadioCardElement,
  PrimitivRadioCardIndicatorElement,
  PrimitivRadioCardItemElement,
  PrimitivSegmentedControlElement,
  PrimitivSegmentedControlItemElement,
  PrimitivSliderElement,
  PrimitivSliderRangeElement,
  PrimitivSliderThumbElement,
  PrimitivSliderTrackElement,
  PrimitivToggleGroupElement,
  PrimitivToggleGroupItemElement,
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

it("types every CheckboxCard tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-checkbox-card")).toEqualTypeOf<PrimitivCheckboxCardElement | null>();
  expectTypeOf(
    document.createElement("primitiv-checkbox-card-indicator"),
  ).toEqualTypeOf<PrimitivCheckboxCardIndicatorElement>();
});

it("types every RadioCard tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-radio-card")).toEqualTypeOf<PrimitivRadioCardElement | null>();
  expectTypeOf(document.createElement("primitiv-radio-card-item")).toEqualTypeOf<PrimitivRadioCardItemElement>();
  expectTypeOf(document.createElement("primitiv-radio-card-indicator")).toEqualTypeOf<PrimitivRadioCardIndicatorElement>();
});

it("types every SegmentedControl tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-segmented-control")).toEqualTypeOf<PrimitivSegmentedControlElement | null>();
  expectTypeOf(
    document.createElement("primitiv-segmented-control-item"),
  ).toEqualTypeOf<PrimitivSegmentedControlItemElement>();
});

it("types every Slider tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-slider")).toEqualTypeOf<PrimitivSliderElement | null>();
  expectTypeOf(document.createElement("primitiv-slider-track")).toEqualTypeOf<PrimitivSliderTrackElement>();
  expectTypeOf(document.createElement("primitiv-slider-range")).toEqualTypeOf<PrimitivSliderRangeElement>();
  expectTypeOf(document.createElement("primitiv-slider-thumb")).toEqualTypeOf<PrimitivSliderThumbElement>();
});

it("types every ToggleGroup tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-toggle-group")).toEqualTypeOf<PrimitivToggleGroupElement | null>();
  expectTypeOf(document.createElement("primitiv-toggle-group-item")).toEqualTypeOf<PrimitivToggleGroupItemElement>();
});

it("types every Tooltip tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-tooltip")).toEqualTypeOf<PrimitivTooltipElement | null>();
  expectTypeOf(document.createElement("primitiv-tooltip-provider")).toEqualTypeOf<PrimitivTooltipProviderElement>();
  expectTypeOf(document.createElement("primitiv-tooltip-trigger")).toEqualTypeOf<PrimitivTooltipTriggerElement>();
  expectTypeOf(document.createElement("primitiv-tooltip-content")).toEqualTypeOf<PrimitivTooltipContentElement>();
  expectTypeOf(document.createElement("primitiv-tooltip-arrow")).toEqualTypeOf<PrimitivTooltipArrowElement>();
});

it("types every Dropdown tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-dropdown")).toEqualTypeOf<PrimitivDropdownElement | null>();
  expectTypeOf(document.createElement("primitiv-dropdown-trigger")).toEqualTypeOf<PrimitivDropdownTriggerElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-content")).toEqualTypeOf<PrimitivDropdownContentElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-item")).toEqualTypeOf<PrimitivDropdownItemElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-checkbox-item")).toEqualTypeOf<PrimitivDropdownCheckboxItemElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-radio-group")).toEqualTypeOf<PrimitivDropdownRadioGroupElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-radio-item")).toEqualTypeOf<PrimitivDropdownRadioItemElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-item-indicator")).toEqualTypeOf<PrimitivDropdownItemIndicatorElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-group")).toEqualTypeOf<PrimitivDropdownGroupElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-label")).toEqualTypeOf<PrimitivDropdownLabelElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-separator")).toEqualTypeOf<PrimitivDropdownSeparatorElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-sub")).toEqualTypeOf<PrimitivDropdownSubElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-sub-trigger")).toEqualTypeOf<PrimitivDropdownSubTriggerElement>();
  expectTypeOf(document.createElement("primitiv-dropdown-sub-content")).toEqualTypeOf<PrimitivDropdownSubContentElement>();
});

it("types every Context Menu tag in HTMLElementTagNameMap", () => {
  expectTypeOf(document.querySelector("primitiv-context-menu")).toEqualTypeOf<PrimitivContextMenuElement | null>();
  expectTypeOf(document.createElement("primitiv-context-menu-trigger")).toEqualTypeOf<PrimitivContextMenuTriggerElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-content")).toEqualTypeOf<PrimitivContextMenuContentElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-item")).toEqualTypeOf<PrimitivContextMenuItemElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-checkbox-item")).toEqualTypeOf<PrimitivContextMenuCheckboxItemElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-radio-group")).toEqualTypeOf<PrimitivContextMenuRadioGroupElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-radio-item")).toEqualTypeOf<PrimitivContextMenuRadioItemElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-item-indicator")).toEqualTypeOf<PrimitivContextMenuItemIndicatorElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-group")).toEqualTypeOf<PrimitivContextMenuGroupElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-label")).toEqualTypeOf<PrimitivContextMenuLabelElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-separator")).toEqualTypeOf<PrimitivContextMenuSeparatorElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-sub")).toEqualTypeOf<PrimitivContextMenuSubElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-sub-trigger")).toEqualTypeOf<PrimitivContextMenuSubTriggerElement>();
  expectTypeOf(document.createElement("primitiv-context-menu-sub-content")).toEqualTypeOf<PrimitivContextMenuSubContentElement>();
});
