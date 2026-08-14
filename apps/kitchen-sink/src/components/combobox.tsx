import "../styles/primitiv/combobox/styles.css";
/*
 * Combobox — styled wrapper, HAND-AUTHORED (bespoke escape hatch, RFC 0004 D53).
 *
 * Not generated, for two reasons. First, the control cannot be the headless
 * <input>: Figma draws one Input frame laid out [leading][value FILL][chevron]
 * (exploration §B1), and you cannot put a chevron inside an <input> — so the
 * frame moves out to a `ComboboxControl` wrapper and the field becomes a bare
 * text run inside it. Second, six of the parts (Control / Leading / Icon /
 * ItemIndicator / ItemLeading / ItemLabel / ItemTrailing) are presentational with
 * no headless counterpart: they mirror the Figma Input's leading/trailing icon
 * properties and the `Listbox / Option` row slots.
 *
 * Everything is a separately-exported part, so a row is composed rather than
 * configured:
 *
 *   <Combobox onQueryChange={setQuery} onValueChange={setFramework}>
 *     <ComboboxControl>
 *       <ComboboxInput aria-label="Framework" placeholder="Search…" />
 *       <ComboboxIcon><ChevronDown /></ComboboxIcon>
 *     </ComboboxControl>
 *     <ComboboxContent aria-label="Frameworks">
 *       {matches.map((f) => (
 *         <ComboboxItem key={f.value} value={f.value}>
 *           <ComboboxItemIndicator><Check /></ComboboxItemIndicator>
 *           <ComboboxItemLabel>{f.label}</ComboboxItemLabel>
 *         </ComboboxItem>
 *       ))}
 *       {matches.length === 0 && <ComboboxEmpty>No matches</ComboboxEmpty>}
 *     </ComboboxContent>
 *   </Combobox>
 *
 * The mark glyph is yours, so nothing here depends on an icon package.
 *
 * FILTERING IS YOURS. There is no `filter` prop by design — `onQueryChange`
 * reports every keystroke and you render the options you want, which keeps async
 * loading, fuzzy matching and sorting where the data lives.
 *
 * SIZE IS SET ONCE, ON THE ROOT. Unlike Select — whose root renders no element in
 * rich mode, so its size must be repeated on the trigger and the panel — the
 * headless Combobox root is a real <div> containing both the control and the
 * panel, and every custom property is declared on it. Custom properties inherit
 * through the DOM tree regardless of positioning, so the fixed-position panel
 * picks them up too.
 *
 * ANCHOR POSITIONING WIRES ITSELF. Positioning needs a unique `anchor-name` on
 * the control and a matching `position-anchor` on the panel — per instance,
 * because reusing one ident across two comboboxes makes the anchor ambiguous and
 * both panels resolve to the same control. `Combobox` derives its own from
 * `useId()` and hands it to `ComboboxControl` and `ComboboxContent` through
 * context, the same fix `dropdown` and `breadcrumb-overflow` already make.
 * Nothing for a consumer to set.
 *
 * It is an inline style rather than a custom property because `anchor-name:
 * var(--x)` does not work: the property is not var()-substitutable in this
 * position and computes to `none`. A consumer's own `style.anchorName` /
 * `style.positionAnchor` still wins (spread order), which is the escape hatch for
 * anchoring the panel to something other than its control.
 *
 * The panel's paint order is a STYLESHEET concern, not this file's — see the
 * z-index note in styles.css. There is deliberately no `showPopover()` call here:
 * that was tried, could not be verified to work in a real browser from this
 * sandbox, and is recorded as a headless-layer job in
 * docs/combobox-future-work.md (where `Select.Content` already does it).
 *
 * Keep contract.json + the stylesheet + this file in sync by hand.
 */
import { Combobox as ComboboxPrimitive } from "@primitiv-ui/react";
import {
  createContext,
  useContext,
  useId,
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  combobox,
  comboboxControl,
  comboboxLeading,
  comboboxInput,
  comboboxIcon,
  comboboxContent,
  comboboxItem,
  comboboxItemIndicator,
  comboboxItemLeading,
  comboboxItemLabel,
  comboboxItemTrailing,
  comboboxEmpty,
} from "./combobox.recipe";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" ");

/* `useId()` returns something like ":r3:", and a CSS <custom-ident> may not
   contain a colon — so every character outside [A-Za-z0-9_-] becomes a hyphen.
   Same helper as NavigationMenu's `toAnchorIdentFragment` and the copies in
   dropdown / breadcrumb-overflow / pagination. */
const toAnchorIdent = (id: string) => `--primitiv-combobox-${id.replace(/[^A-Za-z0-9_-]/g, "-")}`;

/* Undefined outside a Combobox, which is what lets `ComboboxControl` and
   `ComboboxContent` stay usable on their own — they simply set no ident. */
const ComboboxAnchorContext = createContext<string | undefined>(undefined);

function useAnchorIdent(): string | undefined {
  return useContext(ComboboxAnchorContext);
}

function AnchorProvider({ children }: { children: ReactNode }) {
  const ident = toAnchorIdent(useId());
  return <ComboboxAnchorContext.Provider value={ident}>{children}</ComboboxAnchorContext.Provider>;
}

type ComboboxSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * An editable text field with a filtered popup listbox — the WAI-ARIA APG
 * combobox pattern. DOM focus never leaves the field; the popup's cursor is
 * virtual focus, published as `aria-activedescendant`.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxProps = DistributiveOmit<
  ComponentPropsWithRef<typeof ComboboxPrimitive.Root>,
  "size"
> & {
  /**
   * Control, panel and row scale — set once here and inherited by every part;
   * `data-density` scales the sizing within each size.
   * @default "md"
   * @see https://primitiv-ui.dev/docs/components/combobox
   */
  size?: ComboboxSize;
};

export function Combobox({ size, className, ...props }: ComboboxProps) {
  return (
    <AnchorProvider>
      <ComboboxPrimitive.Root className={cx(combobox({ size }), className)} {...props} />
    </AnchorProvider>
  );
}

/**
 * The framed control — the box a consumer reads as the field. It owns the border,
 * radius, height, background and the focus ring, and forwards the inner input's
 * focus / invalid / disabled / expanded state outward with `:has()`.
 *
 * Registry-only: it exists because a chevron cannot live inside an `<input>`.
 * Lay it out as `[ComboboxLeading?][ComboboxInput][ComboboxIcon?]`.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxControlProps = ComponentPropsWithRef<"div">;

export function ComboboxControl({ className, style, ...props }: ComboboxControlProps) {
  const anchorName = useAnchorIdent();
  return (
    <div
      className={cx(comboboxControl(), className)}
      style={{ anchorName, ...style } as CSSProperties}
      {...props}
    />
  );
}

/**
 * Optional standing glyph at the start of the field. This is the search flavour
 * settled in the Figma exploration (§B1) — a magnifier here and no
 * {@link ComboboxIcon} gives you a search field, kept as a documented variation
 * rather than a second component.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxLeadingProps = ComponentPropsWithRef<"span">;

export function ComboboxLeading({ className, ...props }: ComboboxLeadingProps) {
  return <span className={cx(comboboxLeading(), className)} {...props} />;
}

export type ComboboxInputProps = ComponentPropsWithRef<typeof ComboboxPrimitive.Input>;

export function ComboboxInput({ className, ...props }: ComboboxInputProps) {
  return <ComboboxPrimitive.Input className={cx(comboboxInput(), className)} {...props} />;
}

/**
 * The trailing mark that says this field has a popup. Drop a chevron inside; it
 * flips while the popup is open.
 *
 * **Decorative only**, and that is a real difference from `SelectIcon`: there the
 * whole frame is a `<button>`, so a click on the chevron opens the listbox for
 * free. Here the frame is a `<div>` wrapping an `<input>`, and the headless layer
 * exposes no open-toggle a trigger could call — the popup opens on typing or
 * ArrowDown. The glyph is `pointer-events: none` so a click aimed at it falls
 * through to the field instead of landing on dead space.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxIconProps = ComponentPropsWithRef<"span">;

export function ComboboxIcon({ className, ...props }: ComboboxIconProps) {
  return <span aria-hidden="true" className={cx(comboboxIcon(), className)} {...props} />;
}

export type ComboboxContentProps = ComponentPropsWithRef<typeof ComboboxPrimitive.Content>;

export function ComboboxContent({ className, style, ...props }: ComboboxContentProps) {
  const positionAnchor = useAnchorIdent();
  return (
    <ComboboxPrimitive.Content
      className={cx(comboboxContent(), className)}
      style={{ positionAnchor, ...style } as CSSProperties}
      {...props}
    />
  );
}

export type ComboboxItemProps = ComponentPropsWithRef<typeof ComboboxPrimitive.Item>;

export function ComboboxItem({ className, ...props }: ComboboxItemProps) {
  return <ComboboxPrimitive.Item className={cx(comboboxItem(), className)} {...props} />;
}

/**
 * The selected mark for a row. Put a glyph inside — it is revealed by CSS when
 * the row is the committed value, and the element stays in the DOM either way so
 * the column it reserves keeps every label on one axis.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxItemIndicatorProps = ComponentPropsWithRef<"span">;

export function ComboboxItemIndicator({ className, ...props }: ComboboxItemIndicatorProps) {
  return (
    <span aria-hidden="true" className={cx(comboboxItemIndicator(), className)} {...props} />
  );
}

/**
 * Optional leading slot inside a row — an icon or small glyph placed after the
 * mark column and before the label.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxItemLeadingProps = ComponentPropsWithRef<"span">;

export function ComboboxItemLeading({ className, ...props }: ComboboxItemLeadingProps) {
  return <span className={cx(comboboxItemLeading(), className)} {...props} />;
}

/**
 * The row's text label. Takes the row's free space and truncates rather than
 * wrapping, so pair it with {@link ComboboxItemTrailing} to keep a trailing
 * affordance on the inline-end edge.
 *
 * **Read this before reaching for it.** The headless layer derives the committed
 * label from an item's children *only when they are a plain string*; with
 * elements inside there is no reliable way to read a label out of arbitrary JSX,
 * so the item's `value` stands in. Wrapping the text in this part therefore
 * changes what the field shows once a choice is committed — from "React" to
 * whatever the value is. Three ways out, in order of preference:
 *
 * 1. Give the item plain string children and skip this part. A bare text node
 *    still works in the row's flex layout, and `ComboboxItemTrailing` pushes
 *    itself to the inline-end edge with `margin-inline-start: auto`, so a
 *    `[mark][text][trailing]` row needs no label element at all.
 * 2. Make `value` the display label (`value="React"`), which is the common case
 *    anyway and keeps this part available for truncation control.
 * 3. Keep this part and accept the value as the closed-state text.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxItemLabelProps = ComponentPropsWithRef<"span">;

export function ComboboxItemLabel({ className, ...props }: ComboboxItemLabelProps) {
  return <span className={cx(comboboxItemLabel(), className)} {...props} />;
}

/**
 * Optional trailing slot inside a row — a shortcut hint, badge or icon on the
 * inline-end edge. Constrained in the block axis only, so non-icon content keeps
 * its natural width.
 *
 * @see https://primitiv-ui.dev/docs/components/combobox
 */
export type ComboboxItemTrailingProps = ComponentPropsWithRef<"span">;

export function ComboboxItemTrailing({ className, ...props }: ComboboxItemTrailingProps) {
  return <span className={cx(comboboxItemTrailing(), className)} {...props} />;
}

export type ComboboxEmptyProps = ComponentPropsWithRef<typeof ComboboxPrimitive.Empty>;

export function ComboboxEmpty({ className, ...props }: ComboboxEmptyProps) {
  return <ComboboxPrimitive.Empty className={cx(comboboxEmpty(), className)} {...props} />;
}
