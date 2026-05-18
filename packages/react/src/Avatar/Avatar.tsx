import { useEffect, useMemo, useState } from "react";

import { AvatarContext } from "./AvatarContext";
import { useAvatarContext, useAvatarImage } from "./hooks";
import {
  AvatarFallbackProps,
  AvatarImageLoadingStatus,
  AvatarImageProps,
  AvatarRootProps,
} from "./types";

/**
 * The root of an Avatar — a `<span>` container that owns the image loading
 * status and provides {@link AvatarContext} to a descendant
 * {@link Avatar.Image | `Avatar.Image`} and
 * {@link Avatar.Fallback | `Avatar.Fallback`}.
 *
 * **Styling hooks.** `data-status="idle" | "loading" | "loaded" | "error"`.
 */
function AvatarRoot({ children, ...rest }: AvatarRootProps) {
  const [status, setStatus] = useState<AvatarImageLoadingStatus>("idle");

  const contextValue = useMemo(() => ({ status, setStatus }), [status]);

  return (
    <AvatarContext.Provider value={contextValue}>
      <span {...rest} data-status={status}>
        {children}
      </span>
    </AvatarContext.Provider>
  );
}

AvatarRoot.displayName = "AvatarRoot";

/**
 * The image of an Avatar — an `<img>` that reports its load lifecycle to the
 * parent {@link Avatar.Root}.
 *
 * **Styling hooks.** `data-status` mirrors the root's status. The image stays
 * mounted on error; hide a broken image with CSS, e.g.
 * `img:not([data-status="loaded"]) { display: none }`.
 *
 * @throws if rendered outside an `Avatar.Root`.
 */
function AvatarImage({ ...rest }: AvatarImageProps) {
  const { status, setStatus } = useAvatarContext();
  const { ref, onLoad, onError } = useAvatarImage(setStatus);

  return (
    <img
      {...rest}
      ref={ref}
      data-status={status}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

AvatarImage.displayName = "AvatarImage";

/**
 * The fallback of an Avatar — a `<span>` shown while the parent
 * {@link Avatar.Root}'s image is anything other than `"loaded"` (missing,
 * loading, or failed). Once the image loads, the fallback unmounts.
 *
 * Pass `delayMs` to withhold the fallback for that many milliseconds after
 * mount, avoiding a flash of fallback content when the image loads quickly.
 *
 * @throws if rendered outside an `Avatar.Root`.
 */
function AvatarFallback({ delayMs, children, ...rest }: AvatarFallbackProps) {
  const { status } = useAvatarContext();
  const [delayElapsed, setDelayElapsed] = useState(delayMs === undefined);

  useEffect(() => {
    if (delayMs === undefined) {
      return;
    }
    const timer = window.setTimeout(() => setDelayElapsed(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  if (status === "loaded" || !delayElapsed) {
    return null;
  }

  return (
    <span {...rest} data-status={status}>
      {children}
    </span>
  );
}

AvatarFallback.displayName = "AvatarFallback";

type TAvatarCompound = typeof AvatarRoot & {
  Root: typeof AvatarRoot;
  Image: typeof AvatarImage;
  Fallback: typeof AvatarFallback;
};

/**
 * Headless, accessible **Avatar** — a compound component for a user image
 * with a graceful fallback. Zero styles ship.
 *
 * - {@link Avatar.Root | `Avatar.Root`} — container, owns loading status.
 * - {@link Avatar.Image | `Avatar.Image`} — the `<img>`, reports its status.
 * - {@link Avatar.Fallback | `Avatar.Fallback`} — shown until the image loads.
 */
const AvatarCompound: TAvatarCompound = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

AvatarCompound.displayName = "Avatar";

export { AvatarCompound as Avatar };
