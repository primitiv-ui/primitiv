/**
 * The elements' event types, for the framework typing entries to share. It
 * imports no framework, so each entry pulls in only its own.
 */

/** The `primitiv-tabs-change` event: bubbles, cancelable, fired before the change applies. */
export type PrimitivTabsChangeEvent = CustomEvent<{ value: string; index: number }>;

/** The `primitiv-accordion-change` event: bubbles, cancelable, fired before the change applies, with every item open afterwards. */
export type PrimitivAccordionChangeEvent = CustomEvent<{ value: string[] }>;

/** The `primitiv-collapsible-change` event: bubbles, cancelable, fired before the change applies, with the open state afterwards. */
export type PrimitivCollapsibleChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-modal-change` event: bubbles, cancelable, fired before the change applies, with the open state afterwards. */
export type PrimitivModalChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-popover-change` event: bubbles, cancelable, fired before the change applies, with the open state afterwards. */
export type PrimitivPopoverChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-tooltip-change` event: bubbles, cancelable, fired before the change applies, with the open state afterwards. */
export type PrimitivTooltipChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-toggle-group-change` event: bubbles, cancelable, fired before the change applies, with every item pressed afterwards. */
export type PrimitivToggleGroupChangeEvent = CustomEvent<{ value: string[] }>;

/** The `primitiv-listbox-change` event: bubbles, cancelable, fired before the change applies, with every option selected afterwards. */
export type PrimitivListboxChangeEvent = CustomEvent<{ value: string[] }>;

/** The `primitiv-select-change` event: bubbles, cancelable, fired before a chosen value applies. */
export type PrimitivSelectChangeEvent = CustomEvent<{ value: string }>;

/** The `primitiv-select-open-change` event: bubbles, cancelable, fired before the list opens or closes. */
export type PrimitivSelectOpenChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-combobox-change` event: bubbles, cancelable, fired before a committed or cleared value applies. */
export type PrimitivComboboxChangeEvent = CustomEvent<{ value: string }>;

/** The `primitiv-combobox-open-change` event: bubbles, cancelable, fired before the list opens or closes. */
export type PrimitivComboboxOpenChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-combobox-query-change` event: bubbles, fired as the field's text changes from typing. */
export type PrimitivComboboxQueryChangeEvent = CustomEvent<{ query: string }>;

/** The `primitiv-segmented-control-change` event: bubbles, cancelable, fired before the change applies, with the segment selected afterwards. */
export type PrimitivSegmentedControlChangeEvent = CustomEvent<{ value: string }>;

/** The `primitiv-radio-card-change` event: bubbles, cancelable, fired before the change applies, with the card selected afterwards. */
export type PrimitivRadioCardChangeEvent = CustomEvent<{ value: string }>;

/** The `primitiv-checkbox-card-change` event: bubbles, cancelable, fired before the change applies, with the state afterwards. */
export type PrimitivCheckboxCardChangeEvent = CustomEvent<{ checked: boolean }>;

/** The `primitiv-slider-change` event: bubbles, cancelable, fired before each change applies, with every thumb's value afterwards. */
export type PrimitivSliderChangeEvent = CustomEvent<{ value: number[] }>;

/** The `primitiv-slider-commit` event: bubbles, fired once an interaction ends, with the values the slider then holds. */
export type PrimitivSliderCommitEvent = CustomEvent<{ value: number[] }>;

/** The `primitiv-dropdown-change` event: bubbles, cancelable, fired before the change applies, with the open state afterwards. */
export type PrimitivDropdownChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-dropdown-sub-change` event: bubbles, cancelable, fired before a submenu's change applies, with its open state afterwards. */
export type PrimitivDropdownSubChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-dropdown-select` event: bubbles, cancelable, fired on an item as it is chosen; cancel it to keep the menu open. */
export type PrimitivDropdownSelectEvent = CustomEvent<null>;

/** The `primitiv-dropdown-checked-change` event: bubbles, cancelable, fired on a checkbox item before it changes, with its state afterwards. */
export type PrimitivDropdownCheckedChangeEvent = CustomEvent<{ checked: boolean }>;

/** The `primitiv-dropdown-value-change` event: bubbles, cancelable, fired on a radio group before its value changes, with the value afterwards. */
export type PrimitivDropdownValueChangeEvent = CustomEvent<{ value: string }>;

/** The `primitiv-context-menu-change` event: bubbles, cancelable, fired before the change applies, with the open state afterwards. */
export type PrimitivContextMenuChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-context-menu-sub-change` event: bubbles, cancelable, fired before a submenu's change applies, with its open state afterwards. */
export type PrimitivContextMenuSubChangeEvent = CustomEvent<{ open: boolean }>;

/** The `primitiv-context-menu-select` event: bubbles, cancelable, fired on an item as it is chosen; cancel it to keep the menu open. */
export type PrimitivContextMenuSelectEvent = CustomEvent<null>;

/** The `primitiv-context-menu-checked-change` event: bubbles, cancelable, fired on a checkbox item before it changes, with its state afterwards. */
export type PrimitivContextMenuCheckedChangeEvent = CustomEvent<{ checked: boolean }>;

/** The `primitiv-context-menu-value-change` event: bubbles, cancelable, fired on a radio group before its value changes, with the value afterwards. */
export type PrimitivContextMenuValueChangeEvent = CustomEvent<{ value: string }>;
