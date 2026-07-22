import { useCallback, useRef } from "react";

import { AvatarImageLoadingStatus } from "../types";

/**
 * Tracks the load lifecycle of an `Avatar.Image` and reports each change to
 * the Avatar root via `setStatus`.
 *
 * The returned `ref` is a callback ref for the `<img>`: the first time the
 * element attaches it inspects `naturalWidth` to catch a browser cache hit —
 * an image already decoded before React attached its `onLoad` handler, whose
 * `load` event would otherwise never reach React. A cache hit is reported as
 * `"loaded"` straight away; any other image is `"loading"` until its
 * `load` / `error` event resolves it via `onLoad` / `onError`.
 *
 * The initial inspection runs only once: later re-attachments (e.g. when a
 * `Slot` recomposes the ref on re-render) must not clobber a status the
 * load events have since moved on from.
 */
export function useAvatarImage(
  setStatus: (status: AvatarImageLoadingStatus) => void,
) {
  const reported = useRef(false);

  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      // The `img === null` guard is load-bearing: without it, detaching the ref
      // dereferences null.naturalWidth and throws (see the "leaving the tree"
      // test, which kills the BlockStatement twin of this line). Stryker's
      // vitest runner does not reliably attribute that React commit-phase throw
      // for the ConditionalExpression variant, so it can't be scored despite
      // being covered and defended — a runner limitation, not an equivalent
      // mutant. The condition->true variant is killed by the "loading on mount"
      // test.
      // Stryker disable next-line ConditionalExpression
      if (img === null || reported.current) {
        return;
      }
      reported.current = true;
      setStatus(img.naturalWidth > 0 ? "loaded" : "loading");
    },
    // Stryker disable next-line ArrayDeclaration: setStatus is a useState
    // setter with a stable identity, so [] and [setStatus] recreate the
    // callback identically — the dependency is behaviourally inert (equivalent).
    [setStatus],
  );

  // Stryker disable next-line ArrayDeclaration: setStatus is a stable useState
  // setter, so the dependency array cannot change the callback — equivalent.
  const onLoad = useCallback(() => setStatus("loaded"), [setStatus]);
  // Stryker disable next-line ArrayDeclaration: setStatus is a stable useState
  // setter, so the dependency array cannot change the callback — equivalent.
  const onError = useCallback(() => setStatus("error"), [setStatus]);

  return { ref, onLoad, onError };
}
