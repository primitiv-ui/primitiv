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
