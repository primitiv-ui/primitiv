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
      if (img === null || reported.current) {
        return;
      }
      reported.current = true;
      setStatus(img.naturalWidth > 0 ? "loaded" : "loading");
    },
    [setStatus],
  );

  const onLoad = useCallback(() => setStatus("loaded"), [setStatus]);
  const onError = useCallback(() => setStatus("error"), [setStatus]);

  return { ref, onLoad, onError };
}
