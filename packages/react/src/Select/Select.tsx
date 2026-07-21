import { ChangeEvent, Children, isValidElement, ReactNode } from "react";
import type { ReactElement } from "react";

import { useFieldProps } from "../Field/hooks/index.ts";
import { Slot } from "../Slot/index.ts";

import {
  SelectGroupProps,
  SelectOptionProps,
  SelectPlaceholderProps,
  SelectRootProps,
} from "./types";

const PLACEHOLDER_DISPLAY_NAME = "SelectPlaceholder";

function hasPlaceholderChild(children: ReactNode): boolean {
  return Children.toArray(children).some((child) => {
    if (!isValidElement(child)) return false;
    const type = child.type as { displayName?: string };
    return type.displayName === PLACEHOLDER_DISPLAY_NAME;
  });
}

/**
 * The root of a Select — renders a native `<select>` element with an
 * implicit `role="combobox"` as provided by the browser.
 *
 * Browser-native behaviour is preserved: keyboard navigation (arrow keys,
 * Home/End, typeahead), the platform popup, mobile UX (iOS/Android wheel
 * pickers), and form submission all work without additional JS. No
 * positioning JS or Portal is involved.
 *
 * **Controlled vs uncontrolled.** Two state modes are statically
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
 * **Ref forwarding.** Pass a `ref` to access the underlying
 * `HTMLSelectElement` directly:
 *
 * ```tsx
 * const ref = useRef<HTMLSelectElement>(null);
 * <Select.Root ref={ref} defaultValue="apple" aria-label="Pick a fruit">…</Select.Root>
 * ```
 *
 * @extends HTMLSelectElement
 *
 * @example Uncontrolled
 * ```tsx
 * <Select.Root defaultValue="apple" aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [fruit, setFruit] = useState("apple");
 *
 * <Select.Root value={fruit} onValueChange={setFruit} aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example With placeholder and groups
 * ```tsx
 * <Select.Root required aria-label="Pick a food">
 *   <Select.Placeholder>Choose…</Select.Placeholder>
 *   <Select.Group label="Fruits">
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </Select.Group>
 *   <Select.Group label="Vegetables">
 *     <Select.Option value="carrot">Carrot</Select.Option>
 *   </Select.Group>
 * </Select.Root>
 * ```
 *
 * @example Field integration
 * ```tsx
 * <Field.Root invalid={!!errors.fruit}>
 *   <Field.Label>Fruit</Field.Label>
 *   <Select.Root {...register("fruit")}>
 *     <Select.Placeholder>Choose a fruit…</Select.Placeholder>
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </Select.Root>
 *   <Field.ErrorText>{errors.fruit?.message}</Field.ErrorText>
 * </Field.Root>
 * ```
 *
 * @example asChild — styled select wrapper
 * ```tsx
 * function StyledSelect(props: ComponentProps<"select">) {
 *   return <select {...props} className="ds-select" />;
 * }
 *
 * <Select.Root asChild value={fruit} onValueChange={setFruit}>
 *   <StyledSelect>
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </StyledSelect>
 * </Select.Root>
 * ```
 */
export function SelectRoot({
  children,
  asChild = false,
  onChange,
  onValueChange,
  value,
  defaultValue,
  ...consumer
}: SelectRootProps): ReactElement {
  const merged = useFieldProps(consumer);

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

  if (asChild) {
    return <Slot {...rootProps}>{children}</Slot>;
  }
  return <select {...rootProps}>{children}</select>;
}

/** @internal */
SelectRoot.displayName = "SelectRoot";

/**
 * An individual choice inside a Select — renders a native `<option>`
 * element with an implicit `role="option"` as provided by the browser.
 *
 * Passes all `OptionHTMLAttributes` through to the DOM. Native `<option>`
 * only renders text; rich content (icons, descriptions) is not supported.
 *
 * Pass `disabled` to make a single choice unreachable from the dropdown
 * while still visible.
 *
 * @extends HTMLOptionElement
 *
 * @example
 * ```tsx
 * <Select.Option value="apple">Apple</Select.Option>
 * <Select.Option value="durian" disabled>Durian (sold out)</Select.Option>
 * ```
 */
export function SelectOption({
  children,
  ...rest
}: SelectOptionProps): ReactElement {
  return <option {...rest}>{children}</option>;
}

/** @internal */
SelectOption.displayName = "SelectOption";

/**
 * Visually groups related options inside the Select popup — renders a
 * native `<optgroup>` element with an implicit `role="group"` as provided
 * by the browser.
 *
 * The required {@link SelectGroupProps.label | `label`} prop is shown by
 * the browser as a non-selectable heading above the group and is announced
 * as the group's accessible name by assistive technology.
 *
 * @extends HTMLOptGroupElement
 *
 * @example
 * ```tsx
 * <Select.Group label="Fruits">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Group>
 * ```
 */
export function SelectGroup({
  children,
  ...rest
}: SelectGroupProps): ReactElement {
  return <optgroup {...rest}>{children}</optgroup>;
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
 * {@link SelectOption | `Select.Option`} or
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
 * <Select.Root required aria-label="Pick a fruit">
 *   <Select.Placeholder>Choose a fruit…</Select.Placeholder>
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
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
  Option: typeof SelectOption;
  Group: typeof SelectGroup;
  Placeholder: typeof SelectPlaceholder;
};

/**
 * Headless **Select** — a compound component wrapping the native
 * `<select>` / `<option>` / `<optgroup>` elements. Zero styles ship.
 *
 * Because the underlying element is the real `<select>`, the browser owns
 * the popup, keyboard interaction (arrow keys, Home/End, typeahead), mobile
 * UX (iOS/Android wheel pickers), and form submission. No positioning JS,
 * no Portal, no anchor positioning.
 *
 * `Select` is both callable (it is an alias of
 * {@link SelectRoot | `Select.Root`}) and carries its sub-components as
 * static properties. Prefer the namespaced form in application code for
 * readability and grep-ability:
 *
 * - {@link SelectRoot | `Select.Root`} — state owner, renders `<select>`, field integration.
 * - {@link SelectOption | `Select.Option`} — renders `<option>`.
 * - {@link SelectGroup | `Select.Group`} — renders `<optgroup>` with a required `label`.
 * - {@link SelectPlaceholder | `Select.Placeholder`} — always `value=""`, disabled, hidden; the initial hint.
 *
 * @example Minimal usage
 * ```tsx
 * import { Select } from "@primitiv-ui/react";
 *
 * <Select.Root defaultValue="apple" aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example Controlled
 * ```tsx
 * const [fruit, setFruit] = useState("apple");
 *
 * <Select.Root value={fruit} onValueChange={setFruit} aria-label="Pick a fruit">
 *   <Select.Option value="apple">Apple</Select.Option>
 *   <Select.Option value="banana">Banana</Select.Option>
 * </Select.Root>
 * ```
 *
 * @example With placeholder and groups
 * ```tsx
 * <Select.Root required aria-label="Pick a food">
 *   <Select.Placeholder>Choose…</Select.Placeholder>
 *   <Select.Group label="Fruits">
 *     <Select.Option value="apple">Apple</Select.Option>
 *   </Select.Group>
 *   <Select.Group label="Vegetables">
 *     <Select.Option value="carrot">Carrot</Select.Option>
 *   </Select.Group>
 * </Select.Root>
 * ```
 *
 * @see {@link SelectRoot} for state modes, placeholder inference, field integration, and `asChild`.
 * @see {@link SelectOption} for per-option disabled state.
 * @see {@link SelectGroup} for the required `label` prop.
 * @see {@link SelectPlaceholder} for the placeholder + `defaultValue` interaction.
 */
const SelectCompound: TSelectCompound = Object.assign(SelectRoot, {
  Root: SelectRoot,
  Option: SelectOption,
  Group: SelectGroup,
  Placeholder: SelectPlaceholder,
});

SelectCompound.displayName = "Select";

export { SelectCompound as Select };
