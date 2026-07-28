import "../styles/primitiv/spacer/styles.css";
/*
 * Spacer — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add spacer`. A blank
 * `flex: 1 0 0` element for pushing flex siblings apart — toolbar left/right
 * groups, card footers, nav bars (RFC 0022). Like <Prose>, it carries zero
 * behaviour — it only adds a class — so, unlike the generated wrappers, it
 * composes no headless primitive. Hand-written, so it has no drift-guard
 * test.
 */
import { type ComponentPropsWithRef } from "react";
import { spacer } from "./spacer.recipe";

export type SpacerProps = ComponentPropsWithRef<"div">;

/**
 * A blank, flex-growing element for pushing flex siblings apart. Only
 * meaningful as a direct child of a flex (or grid) container — e.g. `Stack`
 * with `direction="row"`. Decorative by default (`aria-hidden`), since it
 * carries no content.
 *
 * @example
 * ```tsx
 * <Stack direction="row" gap="sm">
 *   <Logo />
 *   <Spacer />
 *   <Button>Sign in</Button>
 * </Stack>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/spacer
 */
export function Spacer({ className, "aria-hidden": ariaHidden = true, ...props }: SpacerProps) {
  return <div className={[spacer(), className].filter(Boolean).join(" ")} aria-hidden={ariaHidden} {...props} />;
}
