/*
 * AspectRatio — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add aspect-ratio`. Constrains
 * embedded media to a ratio via CSS `aspect-ratio` (RFC 0022). Like <Box>,
 * it carries zero behaviour — it only adds a class and an inline custom
 * property — so, unlike the generated wrappers, it composes no headless
 * primitive. Hand-written, so it has no drift-guard test.
 */
import { type ComponentPropsWithRef } from "react";
import { aspectRatio, type AspectRatioVariants } from "./aspect-ratio.recipe";

export type AspectRatioProps = ComponentPropsWithRef<"div"> & AspectRatioVariants;

/**
 * Constrains its content to a width-to-height ratio via CSS `aspect-ratio`.
 * The child fills the ratio box regardless of its own intrinsic size; an
 * `<img>`/`<video>` still needs its own `object-fit` to crop rather than
 * distort.
 *
 * `ratio` is a curated preset (`"1/1"` default, `"4/3"`, `"3/2"`, `"16/9"`,
 * `"21/9"` and the portrait inverses `"3/4"`, `"2/3"`, `"9/16"`). For a bespoke
 * ratio, override `--primitiv-aspect-ratio` in your own stylesheet rather than
 * inline — this component writes no `style` attribute.
 *
 * Do not set `align-items` on a container of these; see the README.
 *
 * @example
 * ```tsx
 * <AspectRatio ratio="16/9">
 *   <img src="…" alt="…" className="my-cover-image" />
 * </AspectRatio>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/aspect-ratio
 */
export function AspectRatio({ ratio, className, children, ...props }: AspectRatioProps) {
  return (
    <div className={[aspectRatio({ ratio }), className].filter(Boolean).join(" ")} {...props}>
      <div className="primitiv-aspect-ratio__content">{children}</div>
    </div>
  );
}
