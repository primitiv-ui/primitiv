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
 * <img>, <svg>, <pre>, ...) and clips it to the figure's corner radius;
 * `Figure.Caption` renders the <figcaption> — mirroring the dot-property
 * pattern already used by the registry's other hand-authored compounds (e.g.
 * `CodeBlock.Header`). Both stay DOM siblings in every `captionPosition`,
 * including `overlay` — the stylesheet positions the caption over the
 * media's bottom edge with CSS alone, so nesting them (as the Figma build
 * does, to clip the caption to the media frame) isn't needed on the web.
 */
import { type ComponentPropsWithRef } from "react";
import { figure, figureCaption, type FigureCaptionVariants, type FigureVariants } from "./figure.recipe";

export type FigureProps = ComponentPropsWithRef<"figure"> & FigureVariants;

/**
 * A `<figure>`/`<figcaption>` pairing that wraps self-contained content (an
 * image, illustration, chart, code listing, table) with an optional
 * caption. `captionPosition` (`"below"|"above"|"overlay"`, default
 * `"below"`) places the caption relative to the media; `size` (`xs`–`xl`,
 * default `md`) scales the caption's type — the media is size-independent,
 * matching Figma, where the Figure's `Size` axis drives only the nested
 * Figcaption. Compose `Figure.Media` + `Figure.Caption`.
 *
 * @example
 * ```tsx
 * <Figure captionPosition="overlay" size="sm">
 *   <Figure.Media><img src="..." alt="..." /></Figure.Media>
 *   <Figure.Caption align="center">A caption.</Figure.Caption>
 * </Figure>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/figure
 */
export function Figure({ captionPosition, size, className, ...props }: FigureProps) {
  return <figure className={[figure({ captionPosition, size }), className].filter(Boolean).join(" ")} {...props} />;
}

export type FigureMediaProps = ComponentPropsWithRef<"div">;

function FigureMedia({ className, ...props }: FigureMediaProps) {
  return <div className={["primitiv-figure__media", className].filter(Boolean).join(" ")} {...props} />;
}

export type FigureCaptionProps = ComponentPropsWithRef<"figcaption"> & FigureCaptionVariants;

/**
 * The `<figcaption>`. `align` (`"start"|"center"|"end"`, default `"start"`)
 * matches Figma's Figcaption `Align` axis and is direction-aware, so
 * `start`/`end` flip under RTL.
 */
function FigureCaption({ align, className, ...props }: FigureCaptionProps) {
  return <figcaption className={[figureCaption({ align }), className].filter(Boolean).join(" ")} {...props} />;
}

Figure.Media = FigureMedia;
Figure.Caption = FigureCaption;
