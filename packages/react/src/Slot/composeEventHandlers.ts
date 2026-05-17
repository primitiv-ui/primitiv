/**
 * Returns an event handler that runs the consumer-supplied handler first,
 * then the library's own handler — unless the consumer called
 * `event.preventDefault()`, in which case the library handler is skipped.
 *
 * This is the standard composition pattern used throughout headless
 * components to let consumers attach their own listeners onto a
 * sub-component without clobbering the component's own behaviour, while
 * still giving them an opt-out via `preventDefault()`.
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
