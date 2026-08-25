import "../styles/primitiv/grid/styles.css";
/*
 * Grid — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add grid`. The CSS Grid layout
 * primitive (RFC 0022, build-order step 3): a fixed or per-breakpoint column
 * count with a token-bound gap. Like <Prose>, it carries zero behaviour — it
 * only adds classes — so, unlike the generated wrappers, it composes no
 * headless primitive: it renders a <div>, or the consumer's own element via
 * `asChild` (Slot). Hand-written, so it has no drift-guard test.
 *
 * `columns` is resolved by `gridColumns` rather than `cva` (an object prop does
 * not fit cva's variant model) and the two class lists are concatenated here.
 * It resolves to modifier classes, never an inline style — the responsive
 * behaviour is entirely CSS, so it is correct in server-rendered markup on the
 * first paint, with no hydration flash (RFC 0022 §8).
 */
import { Slot } from "@primitiv-ui/react";
import { type ComponentPropsWithRef, type ElementType } from "react";
import { grid, gridColumns, type GridColumns, type GridVariants } from "./grid.recipe";

export type GridProps = ComponentPropsWithRef<"div"> &
  GridVariants & {
    /**
     * The column count — either one value for every width (`3`) or a
     * mobile-first map (`{ base: 1, md: 2, lg: 3 }`), where `base` is the floor
     * and each named tier applies from that breakpoint up. Defaults to a single
     * column.
     */
    columns?: GridColumns;
    /**
     * Render the single child element instead of a wrapping <div>, merging the
     * grid classes onto it — e.g. `<Grid asChild><ul>...</ul></Grid>`.
     */
    asChild?: boolean;
  };

/**
 * A CSS Grid container. `columns` (default `1`) takes a count or a
 * per-breakpoint map; `gap` (`none`–`xl`, default `md`) resolves against a
 * density-scaled Context token per step; `align`
 * (`start`|`center`|`end`|`stretch`|`baseline`, default `stretch`) and
 * `justify` (`start`|`center`|`end`|`stretch`, default `stretch`) set how each
 * item sits within its cell. Every prop is a modifier class — `Grid` writes no
 * inline styles.
 *
 * Tracks are `minmax(0, 1fr)` rather than `1fr`, so a child with long
 * unbreakable content is clipped by its track instead of blowing the row out
 * past the container.
 *
 * @example
 * ```tsx
 * <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="lg">
 *   <Card />
 *   <Card />
 *   <Card />
 * </Grid>
 *
 * <Grid columns={{ base: 2, md: 4 }} gap="sm">
 *   {swatches.map((s) => <Swatch key={s.id} {...s} />)}
 * </Grid>
 *
 * <Grid columns={3} gap="md" align="center">...</Grid>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/grid
 */
export function Grid({
  columns,
  gap,
  align,
  justify,
  asChild = false,
  className,
  ...props
}: GridProps) {
  const Comp: ElementType = asChild ? Slot : "div";
  return (
    <Comp
      className={[grid({ gap, align, justify }), ...gridColumns(columns), className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
