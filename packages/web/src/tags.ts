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
} from "./context-menu/elements.ts";
import type {
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
} from "./dropdown/elements.ts";
import type {
  PrimitivModalCloseElement,
  PrimitivModalContentElement,
  PrimitivModalDescriptionElement,
  PrimitivModalElement,
  PrimitivModalTitleElement,
  PrimitivModalTriggerElement,
} from "./modal/elements.ts";
import type {
  PrimitivPopoverAnchorElement,
  PrimitivPopoverCloseElement,
  PrimitivPopoverContentElement,
  PrimitivPopoverDescriptionElement,
  PrimitivPopoverElement,
  PrimitivPopoverTitleElement,
  PrimitivPopoverTriggerElement,
} from "./popover/elements.ts";
import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "./tabs/elements.ts";

import type {
  PrimitivTooltipArrowElement,
  PrimitivTooltipContentElement,
  PrimitivTooltipElement,
  PrimitivTooltipProviderElement,
  PrimitivTooltipTriggerElement,
} from "./tooltip/elements.ts";
import type {
  PrimitivRadioCardElement,
  PrimitivRadioCardIndicatorElement,
  PrimitivRadioCardItemElement,
} from "./radio-card/elements.ts";
import type {
  PrimitivSegmentedControlElement,
  PrimitivSegmentedControlItemElement,
} from "./segmented-control/elements.ts";
import type { PrimitivToggleGroupElement, PrimitivToggleGroupItemElement } from "./toggle-group/elements.ts";
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
    "primitiv-popover": PrimitivPopoverElement;
    "primitiv-popover-trigger": PrimitivPopoverTriggerElement;
    "primitiv-popover-anchor": PrimitivPopoverAnchorElement;
    "primitiv-popover-content": PrimitivPopoverContentElement;
    "primitiv-popover-title": PrimitivPopoverTitleElement;
    "primitiv-popover-description": PrimitivPopoverDescriptionElement;
    "primitiv-popover-close": PrimitivPopoverCloseElement;
    "primitiv-tabs": PrimitivTabsElement;
    "primitiv-tabs-list": PrimitivTabsListElement;
    "primitiv-tabs-trigger": PrimitivTabsTriggerElement;
    "primitiv-tabs-content": PrimitivTabsContentElement;
    "primitiv-context-menu": PrimitivContextMenuElement;
    "primitiv-context-menu-trigger": PrimitivContextMenuTriggerElement;
    "primitiv-context-menu-content": PrimitivContextMenuContentElement;
    "primitiv-context-menu-item": PrimitivContextMenuItemElement;
    "primitiv-context-menu-checkbox-item": PrimitivContextMenuCheckboxItemElement;
    "primitiv-context-menu-radio-group": PrimitivContextMenuRadioGroupElement;
    "primitiv-context-menu-radio-item": PrimitivContextMenuRadioItemElement;
    "primitiv-context-menu-item-indicator": PrimitivContextMenuItemIndicatorElement;
    "primitiv-context-menu-group": PrimitivContextMenuGroupElement;
    "primitiv-context-menu-label": PrimitivContextMenuLabelElement;
    "primitiv-context-menu-separator": PrimitivContextMenuSeparatorElement;
    "primitiv-context-menu-sub": PrimitivContextMenuSubElement;
    "primitiv-context-menu-sub-trigger": PrimitivContextMenuSubTriggerElement;
    "primitiv-context-menu-sub-content": PrimitivContextMenuSubContentElement;
    "primitiv-dropdown": PrimitivDropdownElement;
    "primitiv-dropdown-trigger": PrimitivDropdownTriggerElement;
    "primitiv-dropdown-content": PrimitivDropdownContentElement;
    "primitiv-dropdown-item": PrimitivDropdownItemElement;
    "primitiv-dropdown-checkbox-item": PrimitivDropdownCheckboxItemElement;
    "primitiv-dropdown-radio-group": PrimitivDropdownRadioGroupElement;
    "primitiv-dropdown-radio-item": PrimitivDropdownRadioItemElement;
    "primitiv-dropdown-item-indicator": PrimitivDropdownItemIndicatorElement;
    "primitiv-dropdown-group": PrimitivDropdownGroupElement;
    "primitiv-dropdown-label": PrimitivDropdownLabelElement;
    "primitiv-dropdown-separator": PrimitivDropdownSeparatorElement;
    "primitiv-dropdown-sub": PrimitivDropdownSubElement;
    "primitiv-dropdown-sub-trigger": PrimitivDropdownSubTriggerElement;
    "primitiv-dropdown-sub-content": PrimitivDropdownSubContentElement;
    "primitiv-tooltip": PrimitivTooltipElement;
    "primitiv-tooltip-provider": PrimitivTooltipProviderElement;
    "primitiv-tooltip-trigger": PrimitivTooltipTriggerElement;
    "primitiv-tooltip-content": PrimitivTooltipContentElement;
    "primitiv-tooltip-arrow": PrimitivTooltipArrowElement;
    "primitiv-toggle-group": PrimitivToggleGroupElement;
    "primitiv-toggle-group-item": PrimitivToggleGroupItemElement;
    "primitiv-segmented-control": PrimitivSegmentedControlElement;
    "primitiv-segmented-control-item": PrimitivSegmentedControlItemElement;
    "primitiv-radio-card": PrimitivRadioCardElement;
    "primitiv-radio-card-item": PrimitivRadioCardItemElement;
    "primitiv-radio-card-indicator": PrimitivRadioCardIndicatorElement;
  }
}

export {};
