import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
} from "react";

import { MillerColumnsColumn } from "./MillerColumns";

/**
 * Produces the next active path when an item at `depth` with id `value`
 * is selected: keeps the columns shallower than `depth` untouched,
 * appends `value`, and drops everything deeper (those columns close).
 */
export function selectAtDepth(
  path: string[],
  depth: number,
  value: string,
): string[] {
  return [...path.slice(0, depth), value];
}

/**
 * Splits a props bag into its `aria-*` entries and everything else.
 *
 * `Root` renders two elements — a plain strip container and the inner
 * `role="tree"` widget — so one props bag has two possible homes. ARIA
 * belongs on the widget (an `aria-label` must name the tree, not its
 * scroll container); `className`, `id`, `style` and the rest belong on
 * the container the consumer actually lays out.
 */
export function partitionAriaProps(props: Record<string, unknown>): {
  aria: Record<string, unknown>;
  rest: Record<string, unknown>;
} {
  const aria: Record<string, unknown> = {};
  const rest: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("aria-")) {
      aria[key] = value;
    } else {
      rest[key] = value;
    }
  }

  return { aria, rest };
}

/**
 * Marker a styling layer sets on a component that renders a `MillerColumns`
 * part, so this module recognises the wrapper as that part.
 *
 * `Item` inspects its children **before** rendering them, so it sees the
 * wrapper component rather than the `MillerColumns.Column` the wrapper
 * returns. Without a marker a wrapped child column is mis-read as cell
 * content: the item stops being a branch (no `aria-expanded`, no chevron, no
 * ArrowRight) and — worse — the column projects into whatever depth slot
 * happens to be open, so selecting *one* branch reveals *every* sibling's
 * children at once.
 *
 * ```tsx
 * function StyledColumn(props: MillerColumnsColumnProps) {
 *   return <MillerColumns.Column {...props} className="column" />;
 * }
 * StyledColumn[MILLER_COLUMNS_PART] = "column";
 * ```
 */
export const MILLER_COLUMNS_PART: "__primitivMillerColumnsPart" =
  "__primitivMillerColumnsPart";

/** The part names {@link MILLER_COLUMNS_PART} accepts. */
export type MillerColumnsPartName = "column";

/** Read a component's {@link MILLER_COLUMNS_PART} marker, if it declares one. */
function millerColumnsPartOf(
  type: unknown,
): MillerColumnsPartName | undefined {
  return (type as Record<string, MillerColumnsPartName | undefined> | null)?.[
    MILLER_COLUMNS_PART
  ];
}

/**
 * Whether `node` is a `MillerColumns.Column` element — either the part itself,
 * or a component that marks itself as standing in for it (see
 * {@link MILLER_COLUMNS_PART}).
 */
export function isColumnElement(node: ReactNode): node is ReactElement {
  return (
    isValidElement(node) &&
    (node.type === MillerColumnsColumn ||
      millerColumnsPartOf(node.type) === "column")
  );
}

/**
 * Splits an `Item`'s children into its cell content and its single
 * optional nested `<MillerColumns.Column>`.
 *
 * The child column is matched however deeply it is wrapped in
 * fragments, since `Children.toArray` does not descend into fragments —
 * so `{cond ? <><Indicator/><Column/></> : null}` is partitioned the
 * same as a bare `<Column/>`. Cell entries are re-keyed because
 * unwrapping fragments can collide the keys `Children.toArray` assigns.
 */
export function partitionItemChildren(children: ReactNode): {
  cell: ReactNode[];
  column: ReactElement | null;
} {
  const cell: ReactNode[] = [];
  let column: ReactElement | null = null;

  const visit = (nodes: ReactNode): void => {
    for (const child of Children.toArray(nodes)) {
      if (isColumnElement(child)) {
        if (column !== null) {
          throw new Error(
            "A MillerColumns.Item may contain at most one nested <MillerColumns.Column>.",
          );
        }
        column = child;
      } else if (isValidElement(child) && child.type === Fragment) {
        visit((child.props as { children?: ReactNode }).children);
      } else {
        cell.push(child);
      }
    }
  };

  visit(children);

  return {
    cell: cell.map((node, index) =>
      isValidElement(node) ? cloneElement(node, { key: `mc-${index}` }) : node,
    ),
    column,
  };
}
