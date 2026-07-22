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
 * **Load-state model.** Root holds the single source of truth for the image's
 * {@link AvatarImageLoadingStatus} in internal state, starting at `"idle"`.
 * The child `Avatar.Image` reports transitions (`"loading"` → `"loaded"` /
 * `"error"`) up through context; `Avatar.Fallback` reads that status to decide
 * whether to render. There is no controlled/uncontrolled split — status is
 * always driven by the image's own load lifecycle.
 *
 * **Styling hooks.** `data-status="idle" | "loading" | "loaded" | "error"`.
 *
 * **`asChild` composition.** Pass `asChild` to render the consumer's own
 * element as the container instead of the native `<span>`, with the
 * `data-status` hook merged in via the {@link Slot} pattern.
 *
 * @extends HTMLSpanElement
 *
 * @example Image with a generated-initials fallback
 * ```tsx
 * <Avatar.Root>
 *   <Avatar.Image src={user.avatarUrl} alt={user.name} />
 *   <Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
 * </Avatar.Root>
 * ```
 *
 * @example Fallback only (no image source)
 * ```tsx
 * <Avatar.Root>
 *   <Avatar.Fallback>
 *     <UserIcon aria-hidden />
 *   </Avatar.Fallback>
 * </Avatar.Root>
 * ```
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

// Runtime-dead: the compound alias below (same object via Object.assign)
// overwrites this to "Avatar" at load, so the value is never observable. The
// assignment stays because it declares `displayName` on `typeof AvatarRoot`,
// which TAvatarCompound extends.
// Stryker disable next-line StringLiteral: overwritten by the compound alias — an equivalent mutant.
AvatarRoot.displayName = "AvatarRoot";

/**
 * The image of an Avatar — an `<img>` that reports its load lifecycle to the
 * parent {@link Avatar.Root}.
 *
 * **Cache-hit safe.** The internal callback ref inspects `naturalWidth` on
 * attach, so an image already decoded in the browser cache (whose `load` event
 * fires before React can bind `onLoad`) is still reported as `"loaded"`. Every
 * other image reports `"loading"` until its `load` / `error` event resolves it.
 *
 * **Styling hooks.** `data-status` mirrors the root's status. The image stays
 * mounted on error rather than unmounting; hide a broken image with CSS, e.g.
 * `img:not([data-status="loaded"]) { display: none }`.
 *
 * **`asChild` composition.** Pass `asChild` to render the consumer's own
 * `<img>`, with the load handlers, ref, and `data-status` hook merged in via
 * the {@link Slot} pattern.
 *
 * @extends HTMLImageElement
 *
 * @example
 * ```tsx
 * <Avatar.Root>
 *   <Avatar.Image src="/ada.png" alt="Ada Lovelace" />
 *   <Avatar.Fallback>AL</Avatar.Fallback>
 * </Avatar.Root>
 * ```
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
 * {@link Avatar.Root}'s image is anything other than `"loaded"` (i.e. `"idle"`,
 * `"loading"`, or `"error"`). Once the image loads, the fallback returns `null`
 * and unmounts. Its children are the consumer's stand-in content — typically
 * generated initials or a placeholder silhouette icon.
 *
 * Pass {@link AvatarFallbackProps.delayMs | `delayMs`} to withhold the fallback
 * for that many milliseconds after mount, avoiding a flash of fallback content
 * when the image loads quickly. Omit it to render the fallback straight away.
 *
 * **`asChild` composition.** Pass `asChild` to render the consumer's own
 * element as the fallback instead of the native `<span>`, with the
 * `data-status` hook merged in via the {@link Slot} pattern.
 *
 * @extends HTMLSpanElement
 *
 * @example Deferred to avoid a flash on fast connections
 * ```tsx
 * <Avatar.Root>
 *   <Avatar.Image src={user.avatarUrl} alt={user.name} />
 *   <Avatar.Fallback delayMs={600}>{initials(user.name)}</Avatar.Fallback>
 * </Avatar.Root>
 * ```
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
    // Stryker disable next-line all: when delayMs is undefined, delayElapsed is
    // already initialised true, so skipping vs. running this branch only sets a
    // timer whose setDelayElapsed(true) is a no-op — no observable difference.
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
 * `Avatar` is both callable (an alias of {@link AvatarRoot | `Avatar.Root`})
 * and carries its sub-components as static properties.
 *
 * - {@link Avatar.Root | `Avatar.Root`} — `<span>` container, owns the image
 *   loading status, context provider.
 * - {@link Avatar.Image | `Avatar.Image`} — the `<img>`, reports its load
 *   status (cache-hit safe).
 * - {@link Avatar.Fallback | `Avatar.Fallback`} — stand-in content shown until
 *   the image loads, with an optional `delayMs` anti-flash guard.
 *
 * @example Minimal usage
 * ```tsx
 * import { Avatar } from "@primitiv-ui/react";
 *
 * <Avatar.Root>
 *   <Avatar.Image src={user.avatarUrl} alt={user.name} />
 *   <Avatar.Fallback>{initials(user.name)}</Avatar.Fallback>
 * </Avatar.Root>
 * ```
 *
 * @see {@link AvatarRoot} for the load-state model and `asChild`.
 * @see {@link AvatarImage} for cache-hit handling and error behaviour.
 * @see {@link AvatarFallback} for the `delayMs` anti-flash guard.
 */
const AvatarCompound: TAvatarCompound = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

AvatarCompound.displayName = "Avatar";

export { AvatarCompound as Avatar };
