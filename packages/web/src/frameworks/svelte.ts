/**
 * Opt-in Svelte 5 template typings for the elements. With this in scope,
 * `svelte-check` checks each tag's attributes and its events:
 *
 * ```svelte
 * <script lang="ts">
 *   import type {} from "@primitiv-ui/web/svelte";
 * </script>
 * <primitiv-tabs {value} onprimitiv-tabs-change={(e) => (value = e.detail.value)}>…</primitiv-tabs>
 * ```
 *
 * Svelte 5 treats an `on…` attribute as a listener for the event named by the
 * rest of it, so the change event's attribute is `onprimitiv-tabs-change`, the
 * same as React 19's (RFC 0033 §5.6.3).
 *
 * npm-only, like `@primitiv-ui/web/tags`: it augments `svelte/elements`, which
 * JSR does not allow a published module to do.
 */
import type { HTMLAttributes } from "svelte/elements";

import type {
  PrimitivAccordionContentElement,
  PrimitivAccordionElement,
  PrimitivAccordionItemElement,
  PrimitivAccordionTriggerElement,
  PrimitivAccordionTriggerIconElement,
} from "../accordion/elements.ts";
import type {
  PrimitivCollapsibleContentElement,
  PrimitivCollapsibleElement,
  PrimitivCollapsibleTriggerElement,
  PrimitivCollapsibleTriggerIconElement,
} from "../collapsible/elements.ts";
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
} from "../context-menu/elements.ts";
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
} from "../dropdown/elements.ts";
import type {
  PrimitivModalCloseElement,
  PrimitivModalContentElement,
  PrimitivModalDescriptionElement,
  PrimitivModalElement,
  PrimitivModalTitleElement,
  PrimitivModalTriggerElement,
} from "../modal/elements.ts";
import type {
  PrimitivPopoverAnchorElement,
  PrimitivPopoverCloseElement,
  PrimitivPopoverContentElement,
  PrimitivPopoverDescriptionElement,
  PrimitivPopoverElement,
  PrimitivPopoverTitleElement,
  PrimitivPopoverTriggerElement,
} from "../popover/elements.ts";
import type {
  PrimitivTabsContentElement,
  PrimitivTabsElement,
  PrimitivTabsListElement,
  PrimitivTabsTriggerElement,
} from "../tabs/elements.ts";
import type {
  PrimitivTooltipArrowElement,
  PrimitivTooltipContentElement,
  PrimitivTooltipElement,
  PrimitivTooltipProviderElement,
  PrimitivTooltipTriggerElement,
} from "../tooltip/elements.ts";
import type {
  PrimitivSegmentedControlElement,
  PrimitivSegmentedControlItemElement,
} from "../segmented-control/elements.ts";
import type {
  PrimitivRadioCardElement,
  PrimitivRadioCardIndicatorElement,
  PrimitivRadioCardItemElement,
} from "../radio-card/elements.ts";
import type { PrimitivCheckboxCardElement, PrimitivCheckboxCardIndicatorElement } from "../checkbox-card/elements.ts";
import type {
  PrimitivSliderElement,
  PrimitivSliderRangeElement,
  PrimitivSliderThumbElement,
  PrimitivSliderTrackElement,
} from "../slider/elements.ts";
import type { PrimitivSplitButtonActionElement, PrimitivSplitButtonElement } from "../split-button/elements.ts";
import type { PrimitivToggleGroupElement, PrimitivToggleGroupItemElement } from "../toggle-group/elements.ts";
import type {
  PrimitivListboxElement,
  PrimitivListboxGroupElement,
  PrimitivListboxGroupLabelElement,
  PrimitivListboxOptionElement,
} from "../listbox/elements.ts";
import type {
  PrimitivComboboxContentElement,
  PrimitivComboboxElement,
  PrimitivComboboxEmptyElement,
  PrimitivComboboxInputElement,
  PrimitivComboboxItemElement,
} from "../combobox/elements.ts";
import type {
  PrimitivSelectContentElement,
  PrimitivSelectElement,
  PrimitivSelectGroupElement,
  PrimitivSelectItemElement,
  PrimitivSelectItemIndicatorElement,
  PrimitivSelectSeparatorElement,
  PrimitivSelectTriggerElement,
  PrimitivSelectValueElement,
} from "../select/elements.ts";
import type {
  PrimitivAccordionChangeEvent,
  PrimitivContextMenuChangeEvent,
  PrimitivContextMenuCheckedChangeEvent,
  PrimitivContextMenuSelectEvent,
  PrimitivContextMenuSubChangeEvent,
  PrimitivContextMenuValueChangeEvent,
  PrimitivDropdownChangeEvent,
  PrimitivDropdownCheckedChangeEvent,
  PrimitivDropdownSelectEvent,
  PrimitivDropdownSubChangeEvent,
  PrimitivDropdownValueChangeEvent,
  PrimitivCollapsibleChangeEvent,
  PrimitivModalChangeEvent,
  PrimitivPopoverChangeEvent,
  PrimitivTabsChangeEvent,
  PrimitivTooltipChangeEvent,
  PrimitivToggleGroupChangeEvent,
  PrimitivListboxChangeEvent,
  PrimitivComboboxChangeEvent,
  PrimitivComboboxOpenChangeEvent,
  PrimitivComboboxQueryChangeEvent,
  PrimitivSelectChangeEvent,
  PrimitivSelectOpenChangeEvent,
  PrimitivSegmentedControlChangeEvent,
  PrimitivRadioCardChangeEvent,
  PrimitivCheckboxCardChangeEvent,
  PrimitivSliderChangeEvent,
  PrimitivSliderCommitEvent,
} from "./events.ts";

/** Svelte's own attributes and events for an element. */
type Attributes<E extends HTMLElement> = HTMLAttributes<E>;

declare module "svelte/elements" {
  interface SvelteHTMLElements {
    "primitiv-accordion": Attributes<PrimitivAccordionElement> & {
      value?: string | readonly string[];
      multiple?: boolean;
      orientation?: "vertical" | "horizontal";
      "onprimitiv-accordion-change"?: (event: PrimitivAccordionChangeEvent) => void;
    };
    "primitiv-accordion-item": Attributes<PrimitivAccordionItemElement> & {
      value: string;
    };
    "primitiv-accordion-trigger": Attributes<PrimitivAccordionTriggerElement> & {
      disabled?: boolean;
    };
    "primitiv-accordion-content": Attributes<PrimitivAccordionContentElement> & {
      "force-mount"?: boolean;
      "onprimitiv-accordion-show"?: (event: CustomEvent) => void;
    };
    "primitiv-accordion-trigger-icon": Attributes<PrimitivAccordionTriggerIconElement>;
    "primitiv-collapsible": Attributes<PrimitivCollapsibleElement> & {
      open?: boolean;
      disabled?: boolean;
      "onprimitiv-collapsible-change"?: (event: PrimitivCollapsibleChangeEvent) => void;
    };
    "primitiv-collapsible-trigger": Attributes<PrimitivCollapsibleTriggerElement>;
    "primitiv-collapsible-content": Attributes<PrimitivCollapsibleContentElement> & {
      "force-mount"?: boolean;
      "collapsed-height"?: string | number;
      "onprimitiv-collapsible-show"?: (event: CustomEvent) => void;
    };
    "primitiv-collapsible-trigger-icon": Attributes<PrimitivCollapsibleTriggerIconElement>;
    "primitiv-context-menu": Attributes<PrimitivContextMenuElement> & {
      open?: boolean;
      "onprimitiv-context-menu-change"?: (event: PrimitivContextMenuChangeEvent) => void;
    };
    "primitiv-context-menu-trigger": Attributes<PrimitivContextMenuTriggerElement> & {
      disabled?: boolean;
    };
    "primitiv-context-menu-content": Attributes<PrimitivContextMenuContentElement> & {
      popover?: "auto" | "manual" | "";
    };
    "primitiv-context-menu-item": Attributes<PrimitivContextMenuItemElement> & {
      disabled?: boolean;
      "onprimitiv-context-menu-select"?: (event: PrimitivContextMenuSelectEvent) => void;
    };
    "primitiv-context-menu-checkbox-item": Attributes<PrimitivContextMenuCheckboxItemElement> & {
      checked?: boolean | "indeterminate";
      disabled?: boolean;
      "onprimitiv-context-menu-checked-change"?: (event: PrimitivContextMenuCheckedChangeEvent) => void;
      "onprimitiv-context-menu-select"?: (event: PrimitivContextMenuSelectEvent) => void;
    };
    "primitiv-context-menu-radio-group": Attributes<PrimitivContextMenuRadioGroupElement> & {
      value?: string;
      "onprimitiv-context-menu-value-change"?: (event: PrimitivContextMenuValueChangeEvent) => void;
    };
    "primitiv-context-menu-radio-item": Attributes<PrimitivContextMenuRadioItemElement> & {
      value: string;
      disabled?: boolean;
      "onprimitiv-context-menu-select"?: (event: PrimitivContextMenuSelectEvent) => void;
    };
    "primitiv-context-menu-item-indicator": Attributes<PrimitivContextMenuItemIndicatorElement> & {
      "force-mount"?: boolean;
    };
    "primitiv-context-menu-group": Attributes<PrimitivContextMenuGroupElement>;
    "primitiv-context-menu-label": Attributes<PrimitivContextMenuLabelElement>;
    "primitiv-context-menu-separator": Attributes<PrimitivContextMenuSeparatorElement>;
    "primitiv-context-menu-sub": Attributes<PrimitivContextMenuSubElement> & {
      open?: boolean;
      "onprimitiv-context-menu-sub-change"?: (event: PrimitivContextMenuSubChangeEvent) => void;
    };
    "primitiv-context-menu-sub-trigger": Attributes<PrimitivContextMenuSubTriggerElement> & {
      disabled?: boolean;
    };
    "primitiv-context-menu-sub-content": Attributes<PrimitivContextMenuSubContentElement> & {
      popover?: "auto" | "manual" | "";
    };
    "primitiv-dropdown": Attributes<PrimitivDropdownElement> & {
      open?: boolean;
      "onprimitiv-dropdown-change"?: (event: PrimitivDropdownChangeEvent) => void;
    };
    "primitiv-dropdown-trigger": Attributes<PrimitivDropdownTriggerElement>;
    "primitiv-dropdown-content": Attributes<PrimitivDropdownContentElement> & {
      popover?: "auto" | "manual" | "";
    };
    "primitiv-dropdown-item": Attributes<PrimitivDropdownItemElement> & {
      disabled?: boolean;
      "onprimitiv-dropdown-select"?: (event: PrimitivDropdownSelectEvent) => void;
    };
    "primitiv-dropdown-checkbox-item": Attributes<PrimitivDropdownCheckboxItemElement> & {
      checked?: boolean | "indeterminate";
      disabled?: boolean;
      "onprimitiv-dropdown-checked-change"?: (event: PrimitivDropdownCheckedChangeEvent) => void;
      "onprimitiv-dropdown-select"?: (event: PrimitivDropdownSelectEvent) => void;
    };
    "primitiv-dropdown-radio-group": Attributes<PrimitivDropdownRadioGroupElement> & {
      value?: string;
      "onprimitiv-dropdown-value-change"?: (event: PrimitivDropdownValueChangeEvent) => void;
    };
    "primitiv-dropdown-radio-item": Attributes<PrimitivDropdownRadioItemElement> & {
      value: string;
      disabled?: boolean;
      "onprimitiv-dropdown-select"?: (event: PrimitivDropdownSelectEvent) => void;
    };
    "primitiv-dropdown-item-indicator": Attributes<PrimitivDropdownItemIndicatorElement> & {
      "force-mount"?: boolean;
    };
    "primitiv-dropdown-group": Attributes<PrimitivDropdownGroupElement>;
    "primitiv-dropdown-label": Attributes<PrimitivDropdownLabelElement>;
    "primitiv-dropdown-separator": Attributes<PrimitivDropdownSeparatorElement>;
    "primitiv-dropdown-sub": Attributes<PrimitivDropdownSubElement> & {
      open?: boolean;
      "onprimitiv-dropdown-sub-change"?: (event: PrimitivDropdownSubChangeEvent) => void;
    };
    "primitiv-dropdown-sub-trigger": Attributes<PrimitivDropdownSubTriggerElement> & {
      disabled?: boolean;
    };
    "primitiv-dropdown-sub-content": Attributes<PrimitivDropdownSubContentElement> & {
      popover?: "auto" | "manual" | "";
    };
    "primitiv-modal": Attributes<PrimitivModalElement> & {
      open?: boolean;
      "onprimitiv-modal-change"?: (event: PrimitivModalChangeEvent) => void;
    };
    "primitiv-modal-trigger": Attributes<PrimitivModalTriggerElement>;
    "primitiv-modal-content": Attributes<PrimitivModalContentElement>;
    "primitiv-modal-title": Attributes<PrimitivModalTitleElement>;
    "primitiv-modal-description": Attributes<PrimitivModalDescriptionElement>;
    "primitiv-modal-close": Attributes<PrimitivModalCloseElement>;
    "primitiv-popover": Attributes<PrimitivPopoverElement> & {
      open?: boolean;
      "onprimitiv-popover-change"?: (event: PrimitivPopoverChangeEvent) => void;
    };
    "primitiv-popover-trigger": Attributes<PrimitivPopoverTriggerElement>;
    "primitiv-popover-anchor": Attributes<PrimitivPopoverAnchorElement>;
    "primitiv-popover-content": Attributes<PrimitivPopoverContentElement>;
    "primitiv-popover-title": Attributes<PrimitivPopoverTitleElement>;
    "primitiv-popover-description": Attributes<PrimitivPopoverDescriptionElement>;
    "primitiv-popover-close": Attributes<PrimitivPopoverCloseElement>;
    "primitiv-tabs": Attributes<PrimitivTabsElement> & {
      value?: string;
      orientation?: "horizontal" | "vertical";
      "activation-mode"?: "automatic" | "manual";
      "onprimitiv-tabs-change"?: (event: PrimitivTabsChangeEvent) => void;
    };
    "primitiv-tabs-list": Attributes<PrimitivTabsListElement> & {
      label?: string;
    };
    "primitiv-tabs-trigger": Attributes<PrimitivTabsTriggerElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-tabs-content": Attributes<PrimitivTabsContentElement> & {
      value: string;
      "onprimitiv-tabs-show"?: (event: CustomEvent) => void;
    };
    "primitiv-tooltip": Attributes<PrimitivTooltipElement> & {
      open?: boolean;
      "delay-duration"?: number | string;
      "disable-hoverable-content"?: boolean;
      "onprimitiv-tooltip-change"?: (event: PrimitivTooltipChangeEvent) => void;
    };
    "primitiv-tooltip-provider": Attributes<PrimitivTooltipProviderElement> & {
      "delay-duration"?: number | string;
      "skip-delay-duration"?: number | string;
    };
    "primitiv-tooltip-trigger": Attributes<PrimitivTooltipTriggerElement>;
    "primitiv-tooltip-content": Attributes<PrimitivTooltipContentElement>;
    "primitiv-tooltip-arrow": Attributes<PrimitivTooltipArrowElement>;
    "primitiv-toggle-group": Attributes<PrimitivToggleGroupElement> & {
      value?: string;
      type?: "single" | "multiple";
      orientation?: "horizontal" | "vertical";
      "onprimitiv-toggle-group-change"?: (event: PrimitivToggleGroupChangeEvent) => void;
    };
    "primitiv-toggle-group-item": Attributes<PrimitivToggleGroupItemElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-listbox": Attributes<PrimitivListboxElement> & {
      value?: string;
      type?: "single" | "multiple";
      orientation?: "horizontal" | "vertical";
      "selection-follows-focus"?: boolean;
      "onprimitiv-listbox-change"?: (event: PrimitivListboxChangeEvent) => void;
    };
    "primitiv-listbox-option": Attributes<PrimitivListboxOptionElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-listbox-group": Attributes<PrimitivListboxGroupElement>;
    "primitiv-listbox-group-label": Attributes<PrimitivListboxGroupLabelElement>;
    "primitiv-combobox": Attributes<PrimitivComboboxElement> & {
      value?: string;
      open?: boolean;
      name?: string;
      "onprimitiv-combobox-change"?: (event: PrimitivComboboxChangeEvent) => void;
      "onprimitiv-combobox-open-change"?: (event: PrimitivComboboxOpenChangeEvent) => void;
      "onprimitiv-combobox-query-change"?: (event: PrimitivComboboxQueryChangeEvent) => void;
    };
    "primitiv-combobox-input": Attributes<PrimitivComboboxInputElement>;
    "primitiv-combobox-content": Attributes<PrimitivComboboxContentElement>;
    "primitiv-combobox-item": Attributes<PrimitivComboboxItemElement> & {
      value: string;
      label?: string;
      disabled?: boolean;
    };
    "primitiv-combobox-empty": Attributes<PrimitivComboboxEmptyElement>;
    "primitiv-select": Attributes<PrimitivSelectElement> & {
      value?: string;
      open?: boolean;
      name?: string;
      required?: boolean;
      disabled?: boolean;
      "onprimitiv-select-change"?: (event: PrimitivSelectChangeEvent) => void;
      "onprimitiv-select-open-change"?: (event: PrimitivSelectOpenChangeEvent) => void;
    };
    "primitiv-select-trigger": Attributes<PrimitivSelectTriggerElement>;
    "primitiv-select-value": Attributes<PrimitivSelectValueElement> & { placeholder?: string };
    "primitiv-select-content": Attributes<PrimitivSelectContentElement>;
    "primitiv-select-item": Attributes<PrimitivSelectItemElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-select-item-indicator": Attributes<PrimitivSelectItemIndicatorElement> & { "force-mount"?: boolean };
    "primitiv-select-group": Attributes<PrimitivSelectGroupElement> & { label?: string };
    "primitiv-select-separator": Attributes<PrimitivSelectSeparatorElement>;
    "primitiv-segmented-control": Attributes<PrimitivSegmentedControlElement> & {
      value?: string;
      orientation?: "horizontal" | "vertical";
      disabled?: boolean;
      "onprimitiv-segmented-control-change"?: (event: PrimitivSegmentedControlChangeEvent) => void;
    };
    "primitiv-segmented-control-item": Attributes<PrimitivSegmentedControlItemElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-radio-card": Attributes<PrimitivRadioCardElement> & {
      value?: string;
      orientation?: "both" | "horizontal" | "vertical";
      "onprimitiv-radio-card-change"?: (event: PrimitivRadioCardChangeEvent) => void;
    };
    "primitiv-radio-card-item": Attributes<PrimitivRadioCardItemElement> & {
      value: string;
      disabled?: boolean;
    };
    "primitiv-radio-card-indicator": Attributes<PrimitivRadioCardIndicatorElement> & {
      "force-mount"?: boolean;
    };
    "primitiv-checkbox-card": Attributes<PrimitivCheckboxCardElement> & {
      checked?: boolean | "indeterminate";
      disabled?: boolean;
      "onprimitiv-checkbox-card-change"?: (event: PrimitivCheckboxCardChangeEvent) => void;
    };
    "primitiv-checkbox-card-indicator": Attributes<PrimitivCheckboxCardIndicatorElement> & {
      "force-mount"?: boolean;
    };
    "primitiv-slider": Attributes<PrimitivSliderElement> & {
      value?: string;
      min?: number | string;
      max?: number | string;
      step?: number | string;
      "min-steps-between-thumbs"?: number | string;
      orientation?: "horizontal" | "vertical";
      inverted?: boolean;
      disabled?: boolean;
      name?: string;
      "onprimitiv-slider-change"?: (event: PrimitivSliderChangeEvent) => void;
      "onprimitiv-slider-commit"?: (event: PrimitivSliderCommitEvent) => void;
    };
    "primitiv-slider-track": Attributes<PrimitivSliderTrackElement>;
    "primitiv-slider-range": Attributes<PrimitivSliderRangeElement>;
    "primitiv-slider-thumb": Attributes<PrimitivSliderThumbElement>;
    "primitiv-split-button": Attributes<PrimitivSplitButtonElement> & {
      disabled?: boolean;
    };
    "primitiv-split-button-action": Attributes<PrimitivSplitButtonActionElement> & {
      disabled?: boolean;
    };
  }
}
