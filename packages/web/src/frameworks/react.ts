/**
 * Opt-in React 19 JSX typings for the raw elements, for a React project that
 * uses `@primitiv-ui/web` directly rather than `@primitiv-ui/react`:
 *
 * ```tsx
 * import type {} from "@primitiv-ui/web/react";
 *
 * <primitiv-tabs value={value} onprimitiv-tabs-change={(e) => setValue(e.detail.value)}>
 * ```
 *
 * React 19 passes a custom element's `on…` prop to `addEventListener` with the
 * name exactly as written, so the change event's prop is
 * `onprimitiv-tabs-change` (RFC 0033 §5.6.3, D29). Most React projects want
 * `@primitiv-ui/react` instead, whose `onValueChange` / `onChange` are the
 * idiomatic names.
 *
 * npm-only, like `@primitiv-ui/web/tags`: it augments the `react` module,
 * which JSR does not allow a published module to do.
 */
import type { DetailedHTMLProps, HTMLAttributes } from "react";

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
} from "./events.ts";

/** React's own props for an element, plus `class`, which React 19 passes to custom elements. */
type ElementProps<E extends HTMLElement> = DetailedHTMLProps<HTMLAttributes<E>, E> & {
  class?: string;
};

export type {
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
};

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "primitiv-accordion": ElementProps<PrimitivAccordionElement> & {
        value?: string | readonly string[];
        multiple?: boolean;
        orientation?: "vertical" | "horizontal";
        "onprimitiv-accordion-change"?: (event: PrimitivAccordionChangeEvent) => void;
      };
      "primitiv-accordion-item": ElementProps<PrimitivAccordionItemElement> & {
        value: string;
      };
      "primitiv-accordion-trigger": ElementProps<PrimitivAccordionTriggerElement> & {
        disabled?: boolean;
      };
      "primitiv-accordion-content": ElementProps<PrimitivAccordionContentElement> & {
        "force-mount"?: boolean;
        "onprimitiv-accordion-show"?: (event: CustomEvent) => void;
      };
      "primitiv-accordion-trigger-icon": ElementProps<PrimitivAccordionTriggerIconElement>;
      "primitiv-collapsible": ElementProps<PrimitivCollapsibleElement> & {
        open?: boolean;
        disabled?: boolean;
        "onprimitiv-collapsible-change"?: (event: PrimitivCollapsibleChangeEvent) => void;
      };
      "primitiv-collapsible-trigger": ElementProps<PrimitivCollapsibleTriggerElement>;
      "primitiv-collapsible-content": ElementProps<PrimitivCollapsibleContentElement> & {
        "force-mount"?: boolean;
        "collapsed-height"?: string | number;
        "onprimitiv-collapsible-show"?: (event: CustomEvent) => void;
      };
      "primitiv-collapsible-trigger-icon": ElementProps<PrimitivCollapsibleTriggerIconElement>;
      "primitiv-context-menu": ElementProps<PrimitivContextMenuElement> & {
        open?: boolean;
        "onprimitiv-context-menu-change"?: (event: PrimitivContextMenuChangeEvent) => void;
      };
      "primitiv-context-menu-trigger": ElementProps<PrimitivContextMenuTriggerElement> & {
        disabled?: boolean;
      };
      "primitiv-context-menu-content": ElementProps<PrimitivContextMenuContentElement> & {
        popover?: "auto" | "manual" | "";
      };
      "primitiv-context-menu-item": ElementProps<PrimitivContextMenuItemElement> & {
        disabled?: boolean;
        "onprimitiv-context-menu-select"?: (event: PrimitivContextMenuSelectEvent) => void;
      };
      "primitiv-context-menu-checkbox-item": ElementProps<PrimitivContextMenuCheckboxItemElement> & {
        checked?: boolean | "indeterminate";
        disabled?: boolean;
        "onprimitiv-context-menu-checked-change"?: (event: PrimitivContextMenuCheckedChangeEvent) => void;
        "onprimitiv-context-menu-select"?: (event: PrimitivContextMenuSelectEvent) => void;
      };
      "primitiv-context-menu-radio-group": ElementProps<PrimitivContextMenuRadioGroupElement> & {
        value?: string;
        "onprimitiv-context-menu-value-change"?: (event: PrimitivContextMenuValueChangeEvent) => void;
      };
      "primitiv-context-menu-radio-item": ElementProps<PrimitivContextMenuRadioItemElement> & {
        value: string;
        disabled?: boolean;
        "onprimitiv-context-menu-select"?: (event: PrimitivContextMenuSelectEvent) => void;
      };
      "primitiv-context-menu-item-indicator": ElementProps<PrimitivContextMenuItemIndicatorElement> & {
        "force-mount"?: boolean;
      };
      "primitiv-context-menu-group": ElementProps<PrimitivContextMenuGroupElement>;
      "primitiv-context-menu-label": ElementProps<PrimitivContextMenuLabelElement>;
      "primitiv-context-menu-separator": ElementProps<PrimitivContextMenuSeparatorElement>;
      "primitiv-context-menu-sub": ElementProps<PrimitivContextMenuSubElement> & {
        open?: boolean;
        "onprimitiv-context-menu-sub-change"?: (event: PrimitivContextMenuSubChangeEvent) => void;
      };
      "primitiv-context-menu-sub-trigger": ElementProps<PrimitivContextMenuSubTriggerElement> & {
        disabled?: boolean;
      };
      "primitiv-context-menu-sub-content": ElementProps<PrimitivContextMenuSubContentElement> & {
        popover?: "auto" | "manual" | "";
      };
      "primitiv-dropdown": ElementProps<PrimitivDropdownElement> & {
        open?: boolean;
        "onprimitiv-dropdown-change"?: (event: PrimitivDropdownChangeEvent) => void;
      };
      "primitiv-dropdown-trigger": ElementProps<PrimitivDropdownTriggerElement>;
      "primitiv-dropdown-content": ElementProps<PrimitivDropdownContentElement> & {
        popover?: "auto" | "manual" | "";
      };
      "primitiv-dropdown-item": ElementProps<PrimitivDropdownItemElement> & {
        disabled?: boolean;
        "onprimitiv-dropdown-select"?: (event: PrimitivDropdownSelectEvent) => void;
      };
      "primitiv-dropdown-checkbox-item": ElementProps<PrimitivDropdownCheckboxItemElement> & {
        checked?: boolean | "indeterminate";
        disabled?: boolean;
        "onprimitiv-dropdown-checked-change"?: (event: PrimitivDropdownCheckedChangeEvent) => void;
        "onprimitiv-dropdown-select"?: (event: PrimitivDropdownSelectEvent) => void;
      };
      "primitiv-dropdown-radio-group": ElementProps<PrimitivDropdownRadioGroupElement> & {
        value?: string;
        "onprimitiv-dropdown-value-change"?: (event: PrimitivDropdownValueChangeEvent) => void;
      };
      "primitiv-dropdown-radio-item": ElementProps<PrimitivDropdownRadioItemElement> & {
        value: string;
        disabled?: boolean;
        "onprimitiv-dropdown-select"?: (event: PrimitivDropdownSelectEvent) => void;
      };
      "primitiv-dropdown-item-indicator": ElementProps<PrimitivDropdownItemIndicatorElement> & {
        "force-mount"?: boolean;
      };
      "primitiv-dropdown-group": ElementProps<PrimitivDropdownGroupElement>;
      "primitiv-dropdown-label": ElementProps<PrimitivDropdownLabelElement>;
      "primitiv-dropdown-separator": ElementProps<PrimitivDropdownSeparatorElement>;
      "primitiv-dropdown-sub": ElementProps<PrimitivDropdownSubElement> & {
        open?: boolean;
        "onprimitiv-dropdown-sub-change"?: (event: PrimitivDropdownSubChangeEvent) => void;
      };
      "primitiv-dropdown-sub-trigger": ElementProps<PrimitivDropdownSubTriggerElement> & {
        disabled?: boolean;
      };
      "primitiv-dropdown-sub-content": ElementProps<PrimitivDropdownSubContentElement> & {
        popover?: "auto" | "manual" | "";
      };
      "primitiv-modal": ElementProps<PrimitivModalElement> & {
        open?: boolean;
        "onprimitiv-modal-change"?: (event: PrimitivModalChangeEvent) => void;
      };
      "primitiv-modal-trigger": ElementProps<PrimitivModalTriggerElement>;
      "primitiv-modal-content": ElementProps<PrimitivModalContentElement>;
      "primitiv-modal-title": ElementProps<PrimitivModalTitleElement>;
      "primitiv-modal-description": ElementProps<PrimitivModalDescriptionElement>;
      "primitiv-modal-close": ElementProps<PrimitivModalCloseElement>;
      "primitiv-popover": ElementProps<PrimitivPopoverElement> & {
        open?: boolean;
        "onprimitiv-popover-change"?: (event: PrimitivPopoverChangeEvent) => void;
      };
      "primitiv-popover-trigger": ElementProps<PrimitivPopoverTriggerElement>;
      "primitiv-popover-anchor": ElementProps<PrimitivPopoverAnchorElement>;
      "primitiv-popover-title": ElementProps<PrimitivPopoverTitleElement>;
      "primitiv-popover-description": ElementProps<PrimitivPopoverDescriptionElement>;
      "primitiv-popover-close": ElementProps<PrimitivPopoverCloseElement>;
      "primitiv-popover-content": ElementProps<PrimitivPopoverContentElement> & {
        popover?: "auto" | "manual" | "";
      };
      "primitiv-tabs": ElementProps<PrimitivTabsElement> & {
        value?: string;
        orientation?: "horizontal" | "vertical";
        "activation-mode"?: "automatic" | "manual";
        "onprimitiv-tabs-change"?: (event: PrimitivTabsChangeEvent) => void;
      };
      "primitiv-tabs-list": ElementProps<PrimitivTabsListElement> & {
        label?: string;
      };
      "primitiv-tabs-trigger": ElementProps<PrimitivTabsTriggerElement> & {
        value: string;
        disabled?: boolean;
      };
      "primitiv-tabs-content": ElementProps<PrimitivTabsContentElement> & {
        value: string;
        "onprimitiv-tabs-show"?: (event: CustomEvent) => void;
      };
      "primitiv-tooltip": ElementProps<PrimitivTooltipElement> & {
        open?: boolean;
        "delay-duration"?: number | string;
        "disable-hoverable-content"?: boolean;
        "onprimitiv-tooltip-change"?: (event: PrimitivTooltipChangeEvent) => void;
      };
      "primitiv-tooltip-provider": ElementProps<PrimitivTooltipProviderElement> & {
        "delay-duration"?: number | string;
        "skip-delay-duration"?: number | string;
      };
      "primitiv-tooltip-trigger": ElementProps<PrimitivTooltipTriggerElement>;
      "primitiv-tooltip-content": ElementProps<PrimitivTooltipContentElement> & {
        popover?: "auto" | "manual" | "";
      };
      "primitiv-tooltip-arrow": ElementProps<PrimitivTooltipArrowElement>;
    }
  }
}
