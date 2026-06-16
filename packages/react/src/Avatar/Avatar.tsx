import { useEffect, useMemo, useState } from "react";
import type { ReactElement } from "react";

import { Slot } from "../Slot/index.ts";

import { AvatarContext } from "./AvatarContext";
import { useAvatarContext, useAvatarImage } from "./hooks/index.ts";
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
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element as
 * the container, with the `data-status` hook merged in.
 */
export function AvatarRoot({
  asChild = false,
  children,
  ...rest
}: AvatarRootProps): ReactElement {
  const [status, setStatus] = useState<AvatarImageLoadingStatus>("idle");

  const contextValue = useMemo(() => ({ status, setStatus }), [status]);

  const rootProps = { ...rest, "data-status": status };

  return (
    <AvatarContext.Provider value={contextValue}>
      {asChild ? (
        <Slot {...rootProps}>{children}</Slot>
      ) : (
        <span {...rootProps}>{children}</span>
      )}
    </AvatarContext.Provider>
  );
}

/** @internal */
AvatarRoot.displayName = "AvatarRoot";

/**
 * The image of an Avatar — an `<img>` that reports its load lifecycle to the
 * parent {@link Avatar.Root}.
 *
 * **Styling hooks.** `data-status` mirrors the root's status. The image stays
 * mounted on error; hide a broken image with CSS, e.g.
 * `img:not([data-status="loaded"]) { display: none }`.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own `<img>`,
 * with the load handlers, ref, and `data-status` hook merged in.
 *
 * @throws if rendered outside an `Avatar.Root`.
 */
export function AvatarImage({
  asChild = false,
  children,
  ...rest
}: AvatarImageProps): ReactElement {
  const { status, setStatus } = useAvatarContext();
  const { ref, onLoad, onError } = useAvatarImage(setStatus);

  const imageProps = {
    ...rest,
    "data-status": status,
    onLoad,
    onError,
  };

  if (asChild) {
    return (
      <Slot {...imageProps} ref={ref}>
        {children}
      </Slot>
    );
  }

  return <img {...imageProps} ref={ref} />;
}

/** @internal */
AvatarImage.displayName = "AvatarImage";

/**
 * The fallback of an Avatar — a `<span>` shown while the parent
 * {@link Avatar.Root}'s image is anything other than `"loaded"` (missing,
 * loading, or failed). Once the image loads, the fallback unmounts.
 *
 * Pass `delayMs` to withhold the fallback for that many milliseconds after
 * mount, avoiding a flash of fallback content when the image loads quickly.
 *
 * **`asChild` prop.** Pass `asChild` to render the consumer's own element as
 * the fallback, with the `data-status` hook merged in.
 *
 * @throws if rendered outside an `Avatar.Root`.
 */
export function AvatarFallback({
  delayMs,
  asChild = false,
  children,
  ...rest
}: AvatarFallbackProps): ReactElement | null {
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

  const fallbackProps = { ...rest, "data-status": status };

  if (asChild) {
    return <Slot {...fallbackProps}>{children}</Slot>;
  }

  return <span {...fallbackProps}>{children}</span>;
}

/** @internal */
AvatarFallback.displayName = "AvatarFallback";

/** Static-property shape of the compound {@link Avatar} export: the callable {@link AvatarRoot} plus its namespaced sub-components. */
export type TAvatarCompound = typeof AvatarRoot & {
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
