import "../styles/primitiv/tree/styles.css";
/*
 * Tree — styled wrapper, generated from contract.json with THREE HAND-AUTHORED
 * deviations (bespoke escape hatches, RFC 0004 D53). Like Accordion and
 * Collapsible — the other two components that animate a panel open — this file
 * is hand-tuned, so it carries no committed-wrapper drift test; the generator is
 * still exercised against the real contract, and this file is type-checked by
 * scripts/check-registry-types.mjs.
 *
 * 1. TreeBranchContent force-mounts the group and wraps its children in a
 *    `.primitiv-tree__branch-content-inner` clip plus a
 *    `.primitiv-tree__branch-content-body` that carries the one indent step —
 *    the display:grid 0fr↔1fr open/close transition (styles.css), the same
 *    three-element shape Accordion uses. `forceMount` is not exposed as a prop
 *    (it is always on): without it the subtree unmounts on close and there is
 *    nothing left to animate.
 * 2. TreeItem renders a leading `.primitiv-tree__item-spacer` — an empty square
 *    the size of a chevron — so a leaf's label lines up with its branch
 *    siblings' in a mixed list. It is the DOM counterpart of the Figma
 *    Tree / Item spacer, and it is what the connector's leaf-length stub reaches.
 * 3. TreeSelectionPath uses the headless render-prop escape hatch to build each
 *    trail out of the REGISTRY Breadcrumb parts rather than letting the headless
 *    render its own bare `Breadcrumb.Root`. That is the whole reason `tree`
 *    dependsOn `breadcrumb`: the bar inherits Breadcrumb's colours, separator and
 *    type wholesale, so there is no second path anatomy to keep in sync. Its
 *    `size` is the TREE's size and resolves to a Breadcrumb size ONE TIER DOWN
 *    (xs|sm -> xs, md -> sm, lg -> md, xl -> lg), matching both the row type
 *    ladder and the Figma Tree / Selection Path set.
 *
 * Because Tree.Branch finds its control and content by inspecting its children
 * BEFORE rendering them, it sees these wrapper components rather than what they
 * render — so both declare which part they stand in for via TREE_PART. Without
 * that marker Tree.Branch throws "must contain a <Tree.BranchControl>".
 *
 * TreeBranchIndicator ships its own chevron and the stylesheet rotates it off
 * data-state, so `<TreeBranchIndicator />` needs no icon package, no glyph and
 * no state wiring from the consumer.
 *
 * Keep this file, contract.json, and the stylesheet in sync by hand.
 */
import { TREE_PART, Tree as TreePrimitive, useTreeLevel } from "@primitiv-ui/react";
import {
  Children,
  Fragment,
  cloneElement,
  isValidElement,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import {
  tree,
  treeItem,
  treeBranch,
  treeBranchControl,
  treeBranchContent,
  treeBranchIndicator,
  treeSelectionPath,
} from "./tree.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...values: Array<string | undefined>) => values.filter(Boolean).join(" ");

/**
 * Wrap bare text children in a label span so they become the flex item that
 * absorbs the row's free space (and can truncate). Runs per child rather than on
 * `children` as a whole, because a row usually mixes an indicator element with a
 * bare string — the `typeof children === "string"` shortcut would miss it.
 * Mirrors the generator's `wrapTextChildren`.
 */
function wrapRowTextNodes(
  children: ReactNode,
  className: string,
  asChild?: boolean,
): ReactNode {
  // Under `asChild` the child is the CONSUMER's element, so its text sits one
  // level deeper than `Children.map` reaches and nothing would wrap it — the
  // row's label span is what absorbs the free space and truncates, so without
  // this an asChild row neither fills nor ellipsises. One level only.
  if (asChild && isValidElement<{ children?: ReactNode }>(children)) {
    return cloneElement(
      children,
      undefined,
      wrapRowTextNodes(children.props.children, className),
    );
  }
  const mapped = Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <span className={className}>{child}</span>
    ) : (
      child
    ),
  );
  return Array.isArray(mapped) && mapped.length === 1 ? mapped[0] : mapped;
}

/**
 * Stamp `forceMount` onto the content child.
 *
 * `Tree.Branch` decides whether to render its content with
 * `content.props.forceMount === true`, reading the props of the element it is
 * HANDED — which is this layer's `TreeBranchContent` wrapper, not the headless
 * part it renders. Setting `forceMount` inside the wrapper is therefore
 * invisible to the branch: it unmounts the subtree on close, and the
 * open/close transition never runs (it has nothing left to animate). React
 * removed `defaultProps` for function components, so the only place to apply
 * it is here, on the element itself, before the branch sees it.
 */
function forceMountBranchContent(children: ReactNode): ReactNode {
  return Children.map(children, (child) =>
    isValidElement(child) &&
    (child.type as { [TREE_PART]?: string })?.[TREE_PART] === "branch-content"
      ? cloneElement(child as ReactElement<{ forceMount?: boolean }>, { forceMount: true })
      : child,
  );
}

/**
 * The default disclosure chevron. The path is copied verbatim from
 * `@primitiv-ui/icons`' chevron-right (packages/icons/icons/svg/chevron-right.svg)
 * rather than imported: no registry component depends on the icons package, so
 * a copied surface never drags one in — the same trade Chip makes with its
 * remove glyph. Re-copy it if that glyph is ever redrawn. Drawn in the
 * CLOSED orientation — the stylesheet turns it a quarter-turn when the branch
 * opens, so one glyph covers both states and cannot fall out of sync. Pass
 * children to `TreeBranchIndicator` to use your own; it will be rotated the
 * same way, so supply the closed orientation.
 */
function ChevronRightGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.06 12 9 20.06 7.94 19l7-7-7-7L9 3.94 17.06 12Z" />
    </svg>
  );
}

/**
 * Publish the row's nesting depth to CSS.
 *
 * The indent is applied as the ROW's own padding rather than as padding on each
 * enclosing group, so every row's box spans the tree's full width and a hover or
 * selected band runs edge to edge (VS Code / Chakra behaviour) instead of
 * starting at the nested level. That needs the depth as a number: `data-depth`
 * is already on the element, but reading it in CSS needs
 * `attr(... type(<integer>))`, which Firefox does not support — so it is threaded
 * through as a custom property instead. `useTreeLevel` is the headless hook that
 * exposes it.
 */
function depthStyle(depth: number, style: CSSProperties | undefined): CSSProperties {
  return { ...style, "--primitiv-tree-depth": depth } as CSSProperties;
}

/**
 * A hierarchical list of expandable branches and selectable leaves — the WAI-ARIA tree view, with connector guide lines and an optional breadcrumb of the selected node's ancestry.
 *
 * @see https://primitiv-ui.dev/docs/components/tree
 */
export type TreeProps = DistributiveOmit<ComponentPropsWithRef<typeof TreePrimitive.Root>, "size"> & {
  /**
   * Row size for the whole tree; `data-density` scales each size further.
   * - `xs` — Extra small.
   * - `sm` — Small.
   * - `md` — Medium (the default).
   * - `lg` — Large.
   * - `xl` — Extra large.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/tree
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /**
   * Whether nested rows are joined to their parent by hairline guide lines.
   * - `lines` — Draw the vertical rail and per-row elbow (the default).
   * - `none` — Indentation only — no guide lines.
   * @default "lines"
   * @see https://primitiv-ui.dev/docs/components/tree
   */
  connectors?: "lines" | "none";
};

export function Tree({ size, connectors, className, ...props }: TreeProps) {
  return <TreePrimitive.Root className={cx(tree({ size, connectors }), className)} {...props} />;
}

export type TreeItemProps = ComponentPropsWithRef<typeof TreePrimitive.Item>;

export function TreeItem({ className, children, style, ...props }: TreeItemProps) {
  const { depth } = useTreeLevel();
  return (
    <TreePrimitive.Item
      className={cx(treeItem(), className)}
      style={depthStyle(depth, style)}
      {...props}
    >
      <span className="primitiv-tree__item-spacer" aria-hidden="true" />
      {wrapRowTextNodes(children, "primitiv-tree__item-label", props.asChild)}
    </TreePrimitive.Item>
  );
}

export type TreeBranchProps = ComponentPropsWithRef<typeof TreePrimitive.Branch>;

export function TreeBranch({ className, children, style, ...props }: TreeBranchProps) {
  const { depth } = useTreeLevel();
  return (
    <TreePrimitive.Branch
      className={cx(treeBranch(), className)}
      style={depthStyle(depth, style)}
      {...props}
    >
      {forceMountBranchContent(children)}
    </TreePrimitive.Branch>
  );
}

export type TreeBranchControlProps = ComponentPropsWithRef<typeof TreePrimitive.BranchControl>;

export function TreeBranchControl({ className, children, ...props }: TreeBranchControlProps) {
  return (
    <TreePrimitive.BranchControl className={cx(treeBranchControl(), className)} {...props}>
      {wrapRowTextNodes(children, "primitiv-tree__branch-control-label", props.asChild)}
    </TreePrimitive.BranchControl>
  );
}

TreeBranchControl[TREE_PART] = "branch-control";

export type TreeBranchContentProps = DistributiveOmit<
  ComponentPropsWithRef<typeof TreePrimitive.BranchContent>,
  "forceMount"
>;

export function TreeBranchContent({ className, children, ...props }: TreeBranchContentProps) {
  return (
    <TreePrimitive.BranchContent
      className={cx(treeBranchContent(), className)}
      {...props}
      forceMount
    >
      <div className="primitiv-tree__branch-content-inner">
        <div className="primitiv-tree__branch-content-body">{children}</div>
      </div>
    </TreePrimitive.BranchContent>
  );
}

TreeBranchContent[TREE_PART] = "branch-content";

export type TreeBranchIndicatorProps = ComponentPropsWithRef<typeof TreePrimitive.BranchIndicator>;

export function TreeBranchIndicator({
  className,
  children,
  ...props
}: TreeBranchIndicatorProps) {
  return (
    <TreePrimitive.BranchIndicator className={cx(treeBranchIndicator(), className)} {...props}>
      {children ?? <ChevronRightGlyph />}
    </TreePrimitive.BranchIndicator>
  );
}

/** Tree size -> Breadcrumb size, one tier down (see the file header). */
const BREADCRUMB_SIZE = {
  xs: "xs",
  sm: "xs",
  md: "sm",
  lg: "md",
  xl: "lg",
} as const;

export type TreeSelectionPathProps = DistributiveOmit<
  ComponentPropsWithRef<typeof TreePrimitive.SelectionPath>,
  "children"
> & {
  /**
   * The size of the tree this bar reflects; it resolves to a Breadcrumb size one
   * tier down, so the bar reads compact beside its rows.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/tree
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** A separator element for every crumb; defaults to Breadcrumb's own chevron. */
  separator?: ReactNode;
};

export function TreeSelectionPath({
  className,
  size = "md",
  separator,
  ...props
}: TreeSelectionPathProps) {
  return (
    <TreePrimitive.SelectionPath className={cx(treeSelectionPath(), className)} {...props}>
      {({ paths }) =>
        paths.map((path, pathIndex) => (
          <Breadcrumb key={pathIndex} size={BREADCRUMB_SIZE[size]}>
            <BreadcrumbList>
              {path.map((segment, segmentIndex) => {
                const isLast = segmentIndex === path.length - 1;
                const label = segment.label ?? segment.value;
                return (
                  <Fragment key={segment.value}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage
                          data-tree-selection-segment=""
                          data-value={segment.value}
                          data-disabled={segment.disabled ? "" : undefined}
                        >
                          {label}
                        </BreadcrumbPage>
                      ) : (
                        <span
                          data-tree-selection-segment=""
                          data-value={segment.value}
                          data-disabled={segment.disabled ? "" : undefined}
                        >
                          {label}
                        </span>
                      )}
                    </BreadcrumbItem>
                    {!isLast ? <BreadcrumbSeparator>{separator}</BreadcrumbSeparator> : null}
                  </Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        ))
      }
    </TreePrimitive.SelectionPath>
  );
}
