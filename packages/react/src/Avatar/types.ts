import { ComponentProps } from "react";

/**
 * The loading status of an Avatar's image.
 *
 * - `"idle"` — no {@link Avatar.Image} has reported yet (the root has only
 *   ever shown its fallback).
 * - `"loading"` — an {@link Avatar.Image} is mounted and its image is in
 *   flight.
 * - `"loaded"` — the image decoded successfully.
 * - `"error"` — the image failed to load.
 */
export type AvatarImageLoadingStatus = "idle" | "loading" | "loaded" | "error";

/**
 * Props for {@link Avatar.Root} — all `<span>` attributes plus `asChild`.
 */
export type AvatarRootProps = ComponentProps<"span"> & {
  /**
   * Render the consumer's own element instead of the native `<span>`, merging
   * the `data-status` hook onto it via {@link Slot}.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Avatar.Image} — all `<img>` attributes plus `asChild`.
 */
export type AvatarImageProps = ComponentProps<"img"> & {
  /**
   * Render the consumer's own `<img>` instead of the native one, merging the
   * load handlers, ref, and `data-status` hook onto it via {@link Slot}.
   * @default false
   */
  asChild?: boolean;
};

/**
 * Props for {@link Avatar.Fallback} — all `<span>` attributes plus the
 * fallback-specific props.
 */
export type AvatarFallbackProps = ComponentProps<"span"> & {
  /**
   * Withhold the fallback for this many milliseconds after mount. Useful to
   * avoid a flash of fallback content on fast connections where the image
   * loads almost immediately. Omit to render the fallback straight away.
   */
  delayMs?: number;
  /**
   * Render the consumer's own element instead of the native `<span>`, merging
   * the `data-status` hook onto it via {@link Slot}.
   * @default false
   */
  asChild?: boolean;
};
