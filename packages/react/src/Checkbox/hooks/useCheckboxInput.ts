import { useState } from "react";
import type { ChangeEvent } from "react";

import { CheckboxChangeHandler, CheckedState } from "../types";

type UseCheckboxInputArgs = {
  defaultChecked?: CheckedState;
  checked?: CheckedState;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: CheckboxChangeHandler;
};

/**
 * Resolves the controlled / uncontrolled tri-state for a {@link Checkbox.Root}
 * and produces the props to spread onto its native `<input type="checkbox">`.
 *
 * Distinct from {@link useCheckboxRoot}, which drives the *button*-based
 * `menuitemcheckbox` items in Dropdown / ContextMenu via a `toggle()` callback.
 * This hook instead lets the native input own the toggling: the boolean half of
 * the state maps to the input's `checked` / `defaultChecked`, and the
 * `"indeterminate"` value is applied by the component via the input's
 * `.indeterminate` DOM property. A native checkbox only toggles between booleans
 * by user action — clicking a mixed checkbox resolves it to `true` — so
 * `onCheckedChange` is always called with a boolean.
 */
export function useCheckboxInput({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  onChange,
}: UseCheckboxInputArgs) {
  const isControlled = controlledChecked !== undefined;
  const [mirror, setMirror] = useState<CheckedState>(defaultChecked ?? false);
  const checked = isControlled ? controlledChecked : mirror;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) return;
    const next = event.target.checked;
    // Stryker disable next-line ConditionalExpression: in controlled mode
    // `inputStateProps` reads controlledChecked, never `mirror`, so setting
    // mirror here (the mutant's always-run form) has no observable effect —
    // equivalent.
    if (!isControlled) setMirror(next);
    onCheckedChange?.(next);
  };

  const inputStateProps = isControlled
    ? { checked: controlledChecked === true }
    : { defaultChecked: defaultChecked === true };

  return { checked, handleChange, inputStateProps };
}
