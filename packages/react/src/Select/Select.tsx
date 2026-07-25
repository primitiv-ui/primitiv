import {
  ChangeEvent,
  Children,
  isValidElement,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
} from "react";
import type { ReactElement } from "react";

import { useFieldProps } from "../Field/hooks/index.ts";
import { composeEventHandlers, Slot } from "../Slot/index.ts";

import { SelectContext, useSelectContext } from "./SelectContext";
import {
  SelectItemIndicatorContext,
  useSelectItemIndicatorContext,
} from "./SelectItemIndicatorContext";
import { useSelectContent, useSelectRoot } from "./hooks/index.ts";
import {
  SelectContentProps,
  SelectGroupProps,
  SelectItemIndicatorProps,
  SelectItemProps,
  SelectPlaceholderProps,
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
} from "./types";

const ITEM_INDICATOR_DISPLAY_NAME = "SelectItemIndicator";

/** Off-screen but still submitted — the rich mode's hidden form `<select>`. */
const VISUALLY_HIDDEN = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

const PLACEHOLDER_DISPLAY_NAME = "SelectPlaceholder";

function hasPlaceholderChild(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    // Stryker disable next-line BooleanLiteral: equivalent — a non-element child is never a placeholder; returning true would infer defaultValue="", but with no matching <option value=""> the browser still selects the first option, so the rendered selection is unchanged.
    if (!isValidElement(child)) return false;
    const type = child.type as { displayName?: string };
    return type.displayName === PLACEHOLDER_DISPLAY_NAME;
  });
}

/**
 * The root of a Select — owns the selection (and, in rich mode, the open)
 * state and provides it to the sub-components.
 *
 * **Two render paths, one API** — chosen by {@link SelectRootBaseProps.native | `native`}:
 *
 * - `native={false}` (**default**) — the rich Popover-API listbox, composed
 *   from {@link SelectTrigger}, {@link SelectValue}, {@link SelectContent},
 *   {@link SelectItem} and {@link SelectItemIndicator}. Items carry arbitrary
 *   content; a visually-hidden `<select name>` is rendered for form
 *   submission.
 * - `native={true}` — a thin wrapper over a real `<select>` (implicit
 *   `role="combobox"`); the browser owns the popup, keyboard, mobile UX and
 *   form submission. {@link SelectItem} becomes an `<option>` (string/number
 *   children only), {@link SelectGroup} an `<optgroup>`.
 *
 * **Controlled vs uncontrolled.** Two selection modes are statically
 * discriminated at the type level so only one shape is accepted by
 * TypeScript at a time:
 *
 * - **Uncontrolled** — pass {@link SelectRootUncontrolledProps.defaultValue | `defaultValue`}
 *   (or omit it). The browser owns the selection. `onValueChange` is optional.
 * - **Controlled** — pass {@link SelectRootControlledProps.value | `value`}
 *   and {@link SelectRootControlledProps.onValueChange | `onValueChange`} together.
 *   Every transition defers back through `onValueChange`, which receives the
 *   new selection as a plain string. The consumer's own `onChange` (the raw
 *   `ChangeEvent`) still fires alongside it.
 *
 * **Placeholder integration.** When a {@link SelectPlaceholder | `Select.Placeholder`}
 * appears among the direct children and neither `value` nor `defaultValue`
 * is set, Root infers `defaultValue=""` so the placeholder — not the first
 * selectable option — is the initial selection. Pair with `required` to
 * make the browser's native form validation catch an unchosen value at
 * submission.
 *
 * **Field integration.** When rendered inside a `<Field.Root>`, Select
 * opts into `FieldContext` and inherits `id`, `aria-describedby`,
 * `aria-invalid`, `disabled`, and `required` from the field. Any prop the
 * consumer passes wins; `aria-describedby` is composed (consumer ids first,
 * then field-supplied description / error ids). Outside a `<Field.Root>`,
 * behaviour is unchanged.
 *
 * **`asChild` composition.** Pass `asChild` to delegate rendering to a
 * single consumer-supplied element (e.g. a styled `<select>` wrapper).
 * Root's `onChange`, `data-disabled`, `value` / `defaultValue`, and other
 * native attributes are merged onto the child via the {@link Slot} pattern.
 * Placeholder-detection walks direct children only in this mode, so
 * `asChild` + placeholder requires the consumer to set `defaultValue=""`
 * explicitly.
 *
 * **Styling hooks.**
 * - `data-disabled=""` — present on the `<select>` when `disabled` is set,
 *   so CSS can target `[data-disabled]` without relying on `:disabled`.
 *
 * Root renders no single semantic element of its own in the default (rich)
 * path — it is a context boundary that also emits a visually-hidden form
 * `<select>`. Under `native` it renders the real `<select>`.
 *
 * @example Rich (default)
 * ```tsx
 * <Select.Root value={framework} onValueChange={setFramework}>
 *   <Select.Trigger>
 *     <Select.Value placeholder="Pick a framework…" />
 *   </Select.Trigger>
 *   <Select.Content>
 *     <Select.Item value="react">
 *       <ReactIcon />
 *       React
 *       <Select.ItemIndicator>✓</Select.ItemIndicator>
 *     </Select.Item>
 *     <Select.Item value="vue">
 *       <VueIcon />
 *       Vue
 *       <Select.ItemIndicator>✓</Select.ItemIndicator>
 *     </Select.Item>
 *   </Select.Content>
 * </Select.Root>
 * ```
 *
 * @example Native
 * ```tsx
 * <Select.Root native defaultValue="apple" aria-label="Pick a fruit">
 *   <Select.Placeholder>Choose…</Select.Placeholder>
 *   <Select.Group label="Fruits">
 *     <Select.Item value="apple">Apple</Select.Item>
 *     <Select.Item value="banana">Banana</Select.Item>
 *   </Select.Group>
 * </Select.Root>
 * ```
 *
 * @example Field integration
 * ```tsx
 * <Field.Root invalid={!!errors.framework}>
 *   <Field.Label>Framework</Field.Label>
 *   <Select.Root name="framework" value={value} onValueChange={onChange}>
 *     <Select.Trigger>
 *       <Select.Value placeholder="Choose…" />
 *     </Select.Trigger>
 *     <Select.Content>
 *       <Select.Item value="react">React</Select.Item>
 *     </Select.Content>
 *   </Select.Root>
 *   <Field.ErrorText>{errors.framework?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 */
export function SelectRoot({
  children,
  native = false,
  asChild = false,
  onChange,
  onValueChange,
  value,
  defaultValue,
  defaultOpen,
  open,
  onOpenChange,
  ...consumer
}: SelectRootProps): ReactElement {
  const merged = useFieldProps(consumer);
  const {
    contextValue,
    value: selectedValue,
    itemValues,
  } = useSelectRoot({
    defaultOpen,
    open,
    onOpenChange,
    value,
    defaultValue,
    onValueChange,
  });

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event);
    onValueChange?.(event.target.value);
  };

  const inferredDefaultValue =
    !asChild &&
    value === undefined &&
    defaultValue === undefined &&
    hasPlaceholderChild(children)
      ? ""
      : defaultValue;

  const controlProps =
    value !== undefined
      ? { value }
      : inferredDefaultValue !== undefined
        ? { defaultValue: inferredDefaultValue }
        : {};

  const rootProps = {
    ...merged,
    ...controlProps,
    "data-disabled": merged.disabled ? "" : undefined,
    onChange: handleChange,
  };

  // Rich (non-native) render path — the fully-styleable Popover listbox.
  // Root provides open/selection state to Trigger / Content / Value via
  // context, and renders a visually-hidden native <select> so the selection
  // still submits through the browser (mirroring what `native` gets free).
  // The hidden select is uncontrolled + remounted by `key` on each change,
  // so it needs no onChange and stays warning-free.
  if (!native) {
    return (
      <SelectContext.Provider value={contextValue}>
        {children}
        <select
          key={selectedValue}
          name={merged.name}
          defaultValue={selectedValue}
          required={merged.required}
          disabled={merged.disabled}
          tabIndex={-1}
          aria-hidden
          style={VISUALLY_HIDDEN}
        >
          <option value="" />
          {itemValues
            .filter((itemValue) => itemValue !== "")
            .map((itemValue) => (
              <option key={itemValue} value={itemValue} />
            ))}
        </select>
      </SelectContext.Provider>
    );
  }

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }
  return <select {...rootProps}>{children}</select>;
}

/** @internal */
SelectRoot.displayName = "SelectRoot";

/**
 * An individual choice inside a Select.
 *
 * In `native` mode (the case handled in this cycle) it renders a native
 * `<option>` element with an implicit `role="option"`. Because an
 * `<option>` can only hold text, `Select.Item` keeps **only the
 * string/number parts** of its children — joined as the option's visible
 * text — and **drops every element child** (icons, indicators). This is
 * the inverse of the string-vs-element split used elsewhere in the
 * library, and it means an icon-only item with no text renders an empty,
 * unlabelled `<option>` under `native`.
 *
 * Pass `disabled` to make a single choice unreachable from the dropdown
 * while still visible.
 *
 * @extends HTMLOptionElement
 *
 * @example Native
 * ```tsx
 * <Select.Root native>
 *   <Select.Item value="apple">Apple</Select.Item>
 *   <Select.Item value="durian" disabled>Durian (sold out)</Select.Item>
 * </Select.Root>
 * ```
 */
export function SelectItem({
  children,
  value,
  disabled,
  onClick,
  ...rest
}: SelectItemProps): ReactElement {
  const ctx = useContext(SelectContext);
  const registerItem = ctx?.registerItem;
  const unregisterItem = ctx?.unregisterItem;
  const selected = ctx?.value === value;

  // Keep the registered content current every render (silent — no bump).
  useEffect(() => {
    registerItem?.(value, children);
  });
  // Drop the registration when the item unmounts or changes value.
  useEffect(() => () => unregisterItem?.(value), [unregisterItem, value]);

  const indicatorContext = useMemo(() => ({ selected }), [selected]);

  // Native mode — no rich context is provided, so render an <option> whose
  // text is only the string/number children (element children are dropped).
  if (!ctx) {
    const text = Children.toArray(children).filter(
      (child): child is string | number =>
        typeof child === "string" || typeof child === "number",
    );
    return (
      <option value={value} disabled={disabled} onClick={onClick} {...rest}>
        {text}
      </option>
    );
  }

  // Rich mode — a listbox option that can carry arbitrary content. Clicking
  // it (when enabled) commits the selection and closes the listbox.
  const handleClick = () => {
    if (disabled) return;
    ctx.select(value);
  };
  const itemProps = {
    ...rest,
    role: "option" as const,
    tabIndex: -1,
    "aria-selected": selected,
    "aria-disabled": disabled || undefined,
    "data-disabled": disabled ? "" : undefined,
    "data-state": selected ? "checked" : "unchecked",
    onClick: composeEventHandlers(onClick, handleClick),
  };
  return (
    <SelectItemIndicatorContext.Provider value={indicatorContext}>
      <div {...itemProps}>{children}</div>
    </SelectItemIndicatorContext.Provider>
  );
}

/** @internal */
SelectItem.displayName = "SelectItem";

/**
 * The rich-mode trigger button that opens the listbox. Exposes the
 * WAI-ARIA listbox-combobox contract: `aria-haspopup="listbox"`,
 * `aria-expanded` reflecting the open state, and `aria-controls` pointing
 * at the {@link SelectContent | `Select.Content`} id. Place a
 * {@link SelectValue | `Select.Value`} inside it to show the current
 * selection.
 *
 * Renders a `<button type="button">` by default; pass `asChild` to compose
 * the ARIA attributes and click handler onto a consumer element via the
 * {@link Slot} pattern.
 *
 * @extends HTMLButtonElement
 *
 * @example
 * ```tsx
 * <Select.Trigger>
 *   <Select.Value placeholder="Pick a framework…" />
 * </Select.Trigger>
 * ```
 */
export function SelectTrigger({
  children,
  onClick,
  asChild = false,
  ...rest
}: SelectTriggerProps): ReactElement {
  const { open, setOpen, contentId, triggerId, triggerRef } = useSelectContext();

  const triggerProps = {
    ...rest,
    ref: triggerRef,
    id: triggerId,
    type: "button" as const,
    "aria-haspopup": "listbox" as const,
    "aria-expanded": open,
    "aria-controls": contentId,
    onClick: composeEventHandlers(onClick, () => setOpen(!open)),
  };

  if (asChild) {
    return <Slot {...triggerProps}>{children}</Slot>;
  }
  return <button {...triggerProps}>{children}</button>;
}

/** @internal */
SelectTrigger.displayName = "SelectTrigger";

/**
 * The rich-mode display of the current selection, placed inside a
 * {@link SelectTrigger | `Select.Trigger`}. Shows the `placeholder` when
 * nothing is selected; mirroring the selected item's content is layered on
 * in a later cycle.
 *
 * Renders a `<span>`.
 *
 * **Styling hooks.**
 * - `data-placeholder=""` — present while nothing is selected (the
 *   `placeholder` is what's rendered), absent as soon as an item's content is
 *   mirrored. This is the hook the styled layer uses to render the muted
 *   placeholder colour versus the filled one.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <Select.Value placeholder="Select a framework…" />
 * ```
 */
export function SelectValue({
  placeholder,
  ...rest
}: SelectValueProps): ReactElement {
  const { value, getItemChildren } = useSelectContext();
  const selectedChildren = value ? getItemChildren(value) : undefined;

  // Mirror the selected item's content, minus its ItemIndicator (the
  // checkmark answers "which row is selected" — redundant on the trigger it
  // already represents). Everything else — icons, badges, text — carries
  // through. Falls back to the placeholder when nothing is selected (or the
  // selected value has no registered item yet).
  const mirrored =
    selectedChildren === undefined
      ? null
      : Children.toArray(selectedChildren).filter(
          (child) =>
            !(
              isValidElement(child) &&
              (child.type as { displayName?: string }).displayName ===
                ITEM_INDICATOR_DISPLAY_NAME
            ),
        );

  return (
    <span {...rest} data-placeholder={mirrored === null ? "" : undefined}>
      {mirrored ?? placeholder}
    </span>
  );
}

/** @internal */
SelectValue.displayName = "SelectValue";

/**
 * The selection mark rendered inside a rich {@link SelectItem} — typically a
 * checkmark. Reads its item's selected state from context and renders only
 * when that item is selected (pass `forceMount` to keep it mounted for
 * CSS/animation), exposing `data-state` (`"checked"` / `"unchecked"`).
 *
 * `Select.Value` deliberately excludes the indicator when mirroring the
 * selection into the trigger.
 *
 * Renders a `<span>` by default; pass `asChild` to compose onto any element
 * (commonly an SVG icon) via the {@link Slot} pattern.
 *
 * @extends HTMLSpanElement
 *
 * @example
 * ```tsx
 * <Select.Item value="react">
 *   <ReactIcon />
 *   React
 *   <Select.ItemIndicator>✓</Select.ItemIndicator>
 * </Select.Item>
 * ```
 */
export function SelectItemIndicator({
  children,
  asChild = false,
  forceMount = false,
  ...rest
}: SelectItemIndicatorProps): ReactElement | null {
  const { selected } = useSelectItemIndicatorContext();

  if (!forceMount && !selected) return null;

  const indicatorProps = {
    ...rest,
    "data-state": selected ? "checked" : "unchecked",
  };
  if (asChild) {
    return <Slot {...indicatorProps}>{children}</Slot>;
  }
  return <span {...indicatorProps}>{children}</span>;
}

/** @internal */
SelectItemIndicator.displayName = ITEM_INDICATOR_DISPLAY_NAME;

/**
 * The rich-mode listbox panel, rendered with the native
 * [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API)
 * (`popover="auto"`) — no portal, no floating-ui. The browser manages the
 * top layer and light-dismiss (outside click / Escape). Opens and closes in
 * sync with the trigger; on open, focus moves into the listbox, and Escape
 * closes it and returns focus to the trigger.
 *
 * Renders a `<div role="listbox">` by default; pass `asChild` to compose the
 * listbox props onto a consumer element via the {@link Slot} pattern.
 *
 * @extends HTMLDivElement
 *
 * @example
 * ```tsx
 * <Select.Content>
 *   <Select.Item value="react">React</Select.Item>
 *   <Select.Item value="vue">Vue</Select.Item>
 * </Select.Content>
 * ```
 */
export function SelectContent({
  children,
  onKeyDown,
  asChild = false,
  ...rest
}: SelectContentProps): ReactElement {
  const { contentProps } = useSelectContent({ onKeyDown, restProps: rest });

  if (asChild) {
    return <Slot {...contentProps}>{children}</Slot>;
  }
  return <div {...contentProps}>{children}</div>;
}

/** @internal */
SelectContent.displayName = "SelectContent";

/**
 * Visually groups related options. In `native` mode it renders an
 * `<optgroup>` (the browser shows {@link SelectGroupProps.label | `label`}
 * as a non-selectable heading); in rich mode it renders a
 * `<div role="group">` with `aria-label={label}`. Either way the `label` is
 * the group's accessible name.
 *
 * @example
 * ```tsx
 * <Select.Group label="Fruits">
 *   <Select.Item value="apple">Apple</Select.Item>
 *   <Select.Item value="banana">Banana</Select.Item>
 * </Select.Group>
 * ```
 */
export function SelectGroup({
  children,
  label,
  ...rest
}: SelectGroupProps): ReactElement {
  const ctx = useContext(SelectContext);
  if (!ctx) {
    return (
      <optgroup label={label} {...rest}>
        {children}
      </optgroup>
    );
  }
  return (
    <div role="group" aria-label={label} {...rest}>
      {children}
    </div>
  );
}

/** @internal */
SelectGroup.displayName = "SelectGroup";

/**
 * A non-selectable hint shown as the initial selection of a Select.
 * Renders a native `<option value="" disabled hidden>` so the browser
 * displays it in the closed control before the user picks anything but
 * makes it unreachable from the dropdown afterwards.
 *
 * Always render it as the **first** child of
 * {@link SelectRoot | `Select.Root`}, above any
 * {@link SelectItem | `Select.Item`} or
 * {@link SelectGroup | `Select.Group`}.
 *
 * When `Select.Placeholder` is present among Root's direct children and
 * neither `value` nor `defaultValue` is set, Root automatically infers
 * `defaultValue=""` so the placeholder — not the first selectable option
 * — is the initial selection. Pair `required` on Root to make the
 * browser's native form validation catch an unchosen value at submission.
 *
 * `value=""`, `disabled`, and `hidden` are fixed by the component and
 * cannot be overridden. See {@link SelectPlaceholderProps}.
 *
 * @extends HTMLOptionElement
 *
 * @example
 * ```tsx
 * <Select.Root native required aria-label="Pick a fruit">
 *   <Select.Placeholder>Choose a fruit…</Select.Placeholder>
 *   <Select.Item value="apple">Apple</Select.Item>
 *   <Select.Item value="banana">Banana</Select.Item>
 * </Select.Root>
 * ```
 */
export function SelectPlaceholder({
  children,
  ...rest
}: SelectPlaceholderProps): ReactElement {
  return (
    <option {...rest} value="" disabled hidden>
      {children}
    </option>
  );
}

/** @internal */
SelectPlaceholder.displayName = "SelectPlaceholder";

/** Type of the {@link Select} compound: the root callable plus its attached sub-components. */
export type TSelectCompound = typeof SelectRoot & {
  Root: typeof SelectRoot;
  Trigger: typeof SelectTrigger;
  Value: typeof SelectValue;
  Content: typeof SelectContent;
  Item: typeof SelectItem;
  ItemIndicator: typeof SelectItemIndicator;
  Group: typeof SelectGroup;
  Placeholder: typeof SelectPlaceholder;
};

/**
 * Headless, accessible single-select **Select** — a compound with two render
 * paths behind one API, chosen by {@link SelectRootBaseProps.native | `native`}:
 * a rich Popover-API listbox (default) or a native `<select>` wrapper. Zero
 * styles ship.
 *
 * `Select` is both callable (an alias of {@link SelectRoot | `Select.Root`})
 * and carries its sub-components as static properties. Prefer the namespaced
 * form in application code:
 *
 * - {@link SelectRoot | `Select.Root`} — state owner + context boundary.
 * - {@link SelectTrigger | `Select.Trigger`} — rich mode: the listbox button.
 * - {@link SelectValue | `Select.Value`} — rich mode: mirrors the selection.
 * - {@link SelectContent | `Select.Content`} — rich mode: the popover listbox.
 * - {@link SelectItem | `Select.Item`} — an option (rich `<div>` / native `<option>`).
 * - {@link SelectItemIndicator | `Select.ItemIndicator`} — rich mode: the selected mark.
 * - {@link SelectGroup | `Select.Group`} — a group (rich `role="group"` / native `<optgroup>`).
 * - {@link SelectPlaceholder | `Select.Placeholder`} — native mode: the initial hint.
 *
 * @example Rich (default)
 * ```tsx
 * import { Select } from "@primitiv-ui/react";
 *
 * <Select.Root value={framework} onValueChange={setFramework}>
 *   <Select.Trigger>
 *     <Select.Value placeholder="Pick a framework…" />
 *   </Select.Trigger>
 *   <Select.Content>
 *     <Select.Item value="react">
 *       React
 *       <Select.ItemIndicator>✓</Select.ItemIndicator>
 *     </Select.Item>
 *     <Select.Item value="vue">
 *       Vue
 *       <Select.ItemIndicator>✓</Select.ItemIndicator>
 *     </Select.Item>
 *   </Select.Content>
 * </Select.Root>
 * ```
 *
 * @example Native
 * ```tsx
 * <Select.Root native defaultValue="apple" aria-label="Pick a fruit">
 *   <Select.Placeholder>Choose…</Select.Placeholder>
 *   <Select.Group label="Fruits">
 *     <Select.Item value="apple">Apple</Select.Item>
 *     <Select.Item value="banana">Banana</Select.Item>
 *   </Select.Group>
 * </Select.Root>
 * ```
 *
 * @see {@link SelectRoot} for the mode + state contract and Field integration.
 * @see {@link SelectValue} for how the selection mirrors into the trigger.
 * @see {@link SelectContent} for the listbox keyboard contract.
 * @see {@link SelectPlaceholder} for the native placeholder + `defaultValue` interaction.
 */
const SelectCompound: TSelectCompound = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Trigger: SelectTrigger,
  Value: SelectValue,
  Content: SelectContent,
  Item: SelectItem,
  ItemIndicator: SelectItemIndicator,
  Group: SelectGroup,
  Placeholder: SelectPlaceholder,
});

SelectCompound.displayName = "Select";

export { SelectCompound as Select };
