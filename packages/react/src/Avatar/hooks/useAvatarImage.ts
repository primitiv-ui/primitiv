import { useCallback } from "react";

import { AvatarImageLoadingStatus } from "../types";

/**
 * Tracks the load lifecycle of an `Avatar.Image` and reports each change to
 * the Avatar root via `setStatus`.
 *
 * The returned `ref` is a callback ref for the `<img>`: when the element
 * mounts it inspects `naturalWidth` to catch a browser cache hit — an image
 * already decoded before React attached its `onLoad` handler, whose `load`
 * event would otherwise never reach React. A cache hit is reported as
 * `"loaded"` straight away; any other image is `"loading"` until its
 * `load` / `error` event resolves it via `onLoad` / `onError`.
 */
export function useAvatarImage(
  setStatus: (status: AvatarImageLoadingStatus) => void,
) {
  const ref = useCallback(
    (img: HTMLImageElement | null) => {
      if (img === null) {
        return;
      }
      setStatus(img.naturalWidth > 0 ? "loaded" : "loading");
    },
    [setStatus],
  );

  const onLoad = useCallback(() => setStatus("loaded"), [setStatus]);
  const onError = useCallback(() => setStatus("error"), [setStatus]);

  return { ref, onLoad, onError };
}
