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
