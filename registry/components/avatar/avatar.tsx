/*
 * Avatar — styled wrapper, generated from contract.json.
 *
 * Do not edit by hand: change registry/components/avatar/contract.json and regenerate.
 * A typed props surface over the headless @primitiv-ui/react component + the
 * generated recipe — the primary DX (RFC 0004 §3.5 / D51).
 */
import { Avatar as AvatarPrimitive } from "@primitiv-ui/react";
import { Children, type ComponentPropsWithRef, type ReactNode } from "react";
import { avatar, avatarImage, avatarFallback } from "./avatar.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * A user image with a graceful fallback for while it loads, or when it is missing or broken.
 *
 * @see https://primitiv-ui.dev/docs/components/avatar
 */
export type AvatarProps = DistributiveOmit<ComponentPropsWithRef<typeof AvatarPrimitive.Root>, "size" | "shape"> & {
  /**
   * Control size; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/avatar
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Corner treatment — fully rounded, or square with size-scaled corners.
   * - `circle` — Fully rounded (the default).
   * - `square` — Square with corners scaled to size.
   * @default "circle"
   * @see https://primitiv-ui.dev/docs/components/avatar
   */
  shape?: "circle" | "square";
};

export function Avatar({ size, shape, className, ...props }: AvatarProps) {
  return <AvatarPrimitive.Root className={[avatar({ size, shape }), className].filter(Boolean).join(" ")} {...props} />;
}

export type AvatarImageProps = ComponentPropsWithRef<typeof AvatarPrimitive.Image>;

export function AvatarImage({ className, ...props }: AvatarImageProps) {
  return <AvatarPrimitive.Image className={[avatarImage(), className].filter(Boolean).join(" ")} {...props} />;
}

export type AvatarFallbackProps = ComponentPropsWithRef<typeof AvatarPrimitive.Fallback>;

function wrapAvatarFallbackTextNodes(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number"
      ? <span className="primitiv-avatar__fallback-label">{child}</span>
      : child,
  );
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <AvatarPrimitive.Fallback className={[avatarFallback(), className].filter(Boolean).join(" ")} {...props}>
      {wrapAvatarFallbackTextNodes(children)}
    </AvatarPrimitive.Fallback>
  );
}
