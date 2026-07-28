/*
 * Figure — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add figure`. Renders a
 * <figure>/<figcaption> pairing with the caption in one of three positions
 * (RFC 0015). RFC 0015 decided against a headless React Figure — this is a
 * registry-only, hand-authored wrapper with zero behaviour, matching
 * <Prose>'s shape. Hand-written, so it has no drift-guard test.
 *
 * Compound subcomponents: `Figure.Media` wraps the embedded media (an
 * <img>, <svg>, <pre>, …) and clips it to the figure's corner radius;
 * `Figure.Caption` renders the <figcaption> — mirroring the dot-property
 * pattern already used by the registry's other hand-authored compounds (e.g.
 * `CodeBlock.Header`). Both stay DOM siblings in every `captionPosition`,
 * including `overlay` — the stylesheet positions the caption over the
 * media's bottom edge with CSS alone, so nesting them (as the Figma build
 * does, to clip the caption to the media frame) isn't needed on the web.
 */
import { type ComponentPropsWithRef } from "react";
import { figure, type FigureVariants } from "./figure.recipe";

export type FigureProps = ComponentPropsWithRef<"figure"> & FigureVariants;

/**
 * A `<figure>`/`<figcaption>` pairing that wraps self-contained content (an
 * image, illustration, chart, code listing, table) with an optional
 * caption. `captionPosition` (`"below"|"above"|"overlay"`, default
 * `"below"`) places the caption relative to the media; compose
 * `Figure.Media` + `Figure.Caption`.
 *
 * @example
 * ```tsx
 * <Figure captionPosition="overlay">
 *   <Figure.Media><img src="…" alt="…" /></Figure.Media>
 *   <Figure.Caption>A caption.</Figure.Caption>
 * </Figure>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/figure
 */
export function Figure({ captionPosition, className, ...props }: FigureProps) {
  return <figure className={[figure({ captionPosition }), className].filter(Boolean).join(" ")} {...props} />;
}

export type FigureMediaProps = ComponentPropsWithRef<"div">;

function FigureMedia({ className, ...props }: FigureMediaProps) {
  return <div className={["primitiv-figure__media", className].filter(Boolean).join(" ")} {...props} />;
}

export type FigureCaptionProps = ComponentPropsWithRef<"figcaption">;

function FigureCaption({ className, ...props }: FigureCaptionProps) {
  return <figcaption className={["primitiv-figure__caption", className].filter(Boolean).join(" ")} {...props} />;
}

Figure.Media = FigureMedia;
Figure.Caption = FigureCaption;
