import "../styles/primitiv/aspect-ratio/styles.css";
/*
 * AspectRatio — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add aspect-ratio`. Constrains
 * embedded media to a ratio via CSS `aspect-ratio` (RFC 0022). Like <Box>,
 * it carries zero behaviour — it only adds a class and an inline custom
 * property — so, unlike the generated wrappers, it composes no headless
 * primitive. Hand-written, so it has no drift-guard test.
 */
import { type ComponentPropsWithRef, type CSSProperties } from "react";
import { aspectRatio } from "./aspect-ratio.recipe";

export type AspectRatioProps = ComponentPropsWithRef<"div"> & {
  /**
   * The width-to-height ratio, unitless (`16 / 9`, `4 / 3`, `1`). Set inline
   * as `--primitiv-aspect-ratio` — a continuous numeric value, not a fixed
   * enum, so there is no modifier class for it.
   * @default 1
   */
  ratio?: number;
};

/**
 * Constrains its content to a width-to-height ratio via CSS `aspect-ratio`.
 * The child fills the ratio box regardless of its own intrinsic size; an
 * `<img>`/`<video>` still needs its own `object-fit` to crop rather than
 * distort.
 *
 * @example
 * ```tsx
 * <AspectRatio ratio={16 / 9}>
 *   <img src="…" alt="…" style={{ objectFit: "cover", inlineSize: "100%", blockSize: "100%" }} />
 * </AspectRatio>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/aspect-ratio
 */
export function AspectRatio({ ratio, className, style, children, ...props }: AspectRatioProps) {
  return (
    <div
      className={[aspectRatio(), className].filter(Boolean).join(" ")}
      style={{ ...style, ...(ratio === undefined ? {} : { "--primitiv-aspect-ratio": ratio }) } as CSSProperties}
      {...props}
    >
      <div className="primitiv-aspect-ratio__content">{children}</div>
    </div>
  );
}
