/*
 * List — styled wrapper.
 *
 * Copied into the consumer repo by `primitiv add list`. Renders a <ul>/<ol>
 * with custom, token-coloured markers (RFC 0012 D9). Like <Prose>, it
 * carries zero behaviour — it only adds classes — so, unlike the generated
 * wrappers, it composes no headless primitive. Hand-written, so it has no
 * drift-guard test.
 *
 * Compound subcomponent: `List.Item` renders the `<li>` — mirroring the
 * dot-property pattern already used by the registry's other hand-authored
 * compounds (e.g. `CodeBlock.Header`).
 */
import { type ComponentPropsWithoutRef, type ComponentPropsWithRef, type Ref } from "react";
import { list, type ListVariants } from "./list.recipe";

export type ListProps = ComponentPropsWithoutRef<"ul"> &
  ListVariants & {
    /**
     * `List` renders either a `<ul>` or an `<ol>` depending on `type`, so its
     * ref can resolve to either element.
     */
    ref?: Ref<HTMLUListElement | HTMLOListElement>;
  };

/**
 * A `<ul>` or `<ol>` with custom, density-scaled markers, item gap and
 * indent. `type` (`"unordered"|"ordered"`, default `"unordered"`) picks the
 * marker; `indent` (default `true`) toggles the left indent for flush/inline
 * contexts where a parent already supplies it; `size` (`xs`–`xl`, default
 * `md`) scales the item text.
 *
 * @example
 * ```tsx
 * <List type="unordered" indent>
 *   <List.Item>First</List.Item>
 *   <List.Item>Second</List.Item>
 * </List>
 * ```
 *
 * @see https://primitiv-ui.dev/docs/components/list
 */
export function List({ type = "unordered", indent, size, className, ref, ...props }: ListProps) {
  const Comp = type === "ordered" ? "ol" : "ul";
  return (
    <Comp
      ref={ref as never}
      className={[list({ type, indent, size }), className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export type ListItemProps = ComponentPropsWithRef<"li"> & {
  /**
   * Dims the row to mark the entry as unavailable, matching the Figma
   * `ListItem` set's `State=disabled` variant (RFC 0012 D9 — 50% opacity over
   * the whole row, marker included).
   *
   * Presentational only. An `<li>` isn't interactive, so this publishes the
   * `data-disabled` styling hook and nothing else — it does not remove
   * anything focusable inside the row from the tab order, which stays the
   * consumer's job.
   *
   * @default false
   */
  disabled?: boolean;
};

function ListItem({ className, disabled, ...props }: ListItemProps) {
  return (
    <li
      className={["primitiv-list__item", className].filter(Boolean).join(" ")}
      data-disabled={disabled ? "" : undefined}
      {...props}
    />
  );
}

List.Item = ListItem;
