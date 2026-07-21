/**
 * Returns an event handler that runs the consumer-supplied handler first,
 * then the library's own handler — unless the consumer called
 * `event.preventDefault()`, in which case the library handler is skipped.
 *
 * This is the standard composition pattern used throughout headless
 * components to let consumers attach their own listeners onto a
 * sub-component's *own* native event props (e.g. `Tabs.Trigger`'s
 * `onClick`, `Modal.Overlay`'s `onClick`) without clobbering the
 * component's own behaviour, while still giving them an opt-out via
 * `preventDefault()`. Wrap it around the component's internal handler at
 * the point the prop is consumed:
 *
 * ```tsx
 * const handleClick = composeEventHandlers(onClick, () => {
 *   // the component's own behaviour, e.g. activating a tab
 * });
 * ```
 *
 * **Not the same mechanism as {@link Slot}.** `Slot`'s own prop-merging
 * (used for the `asChild` pattern) also composes event handlers, but with
 * the *opposite* order (child fires first, then Slot) and *no*
 * `preventDefault()` opt-out — both handlers always run there. Reach for
 * `composeEventHandlers` when a component owns a native DOM prop directly;
 * reach for `Slot` when delegating rendering to a consumer-supplied
 * element via `asChild`. The two are never used together on the same prop.
 *
 * @example Consumer logs every click; component still closes the modal
 * afterwards:
 * ```tsx
 * <Modal.Overlay onClick={(e) => console.log("overlay clicked")} />
 * ```
 *
 * @example Consumer vetoes the component's behaviour:
 * ```tsx
 * <Modal.Overlay onClick={(e) => {
 *   if (formIsDirty) e.preventDefault(); // don't close
 * }} />
 * ```
 *
 * @example Opting out of the veto — always run our handler too
 * ```tsx
 * const handleClick = composeEventHandlers(onClick, ourHandler, {
 *   checkForDefaultPrevented: false,
 * });
 * ```
 */
export function composeEventHandlers<E>(
  theirHandler: ((event: E) => void) | undefined,
  ourHandler: (event: E) => void,
  { checkForDefaultPrevented = true }: { checkForDefaultPrevented?: boolean } = {},
) {
  return function handleEvent(event: E) {
    theirHandler?.(event);
    if (
      !checkForDefaultPrevented ||
      !(event as unknown as Event).defaultPrevented
    ) {
      ourHandler(event);
    }
  };
}
