/**
 * The elements' event types, for the framework typing entries to share. It
 * imports no framework, so each entry pulls in only its own.
 */

/** The `primitiv-tabs-change` event: bubbles, cancelable, fired before the change applies. */
export type PrimitivTabsChangeEvent = CustomEvent<{ value: string; index: number }>;
