import { AvatarRootProps } from "./types";

/**
 * The root of an Avatar — a `<span>` container for an
 * {@link Avatar.Image | `Avatar.Image`} and an
 * {@link Avatar.Fallback | `Avatar.Fallback`}.
 */
function AvatarRoot({ children, ...rest }: AvatarRootProps) {
  return <span {...rest}>{children}</span>;
}

AvatarRoot.displayName = "AvatarRoot";

type TAvatarCompound = typeof AvatarRoot & {
  Root: typeof AvatarRoot;
};

/**
 * Headless, accessible **Avatar** — a compound component for a user image
 * with a graceful fallback. Zero styles ship.
 */
const AvatarCompound: TAvatarCompound = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
});

AvatarCompound.displayName = "Avatar";

export { AvatarCompound as Avatar };
