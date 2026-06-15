import { createStrictContext } from "../utils/index.ts";

import { AvatarImageLoadingStatus } from "./types";

/**
 * Value shared by {@link Avatar.Root} with its descendant
 * {@link Avatar.Image} and {@link Avatar.Fallback}.
 */
export type AvatarContextValue = {
  /** Current image loading status, owned by the root. */
  status: AvatarImageLoadingStatus;
  /** Reports a new loading status up to the root. */
  setStatus: (status: AvatarImageLoadingStatus) => void;
};

export const [AvatarContext, useAvatarContext] =
  createStrictContext<AvatarContextValue>(
    "Avatar.Image and Avatar.Fallback must be rendered inside an <Avatar.Root>.",
    "AvatarContext",
  );
