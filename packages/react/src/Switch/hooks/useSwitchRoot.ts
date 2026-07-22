import { useState } from "react";
import type { ChangeEvent } from "react";

import { SwitchChangeHandler } from "../types";

type UseSwitchRootArgs = {
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: SwitchChangeHandler;
};

/**
 * Resolves the controlled / uncontrolled state for a {@link Switch.Root} and
 * produces the props to spread onto its native `<input type="checkbox"
 * role="switch">`.
 *
 * In uncontrolled mode the input is rendered with `defaultChecked` and no
 * `checked` prop, so the browser owns the value and the switch participates in
 * forms and resets. The returned `checked` is a best-effort mirror for the
 * `data-state` hook, updated from the input's own `change` events.
 */
export function useSwitchRoot({
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  onChange,
}: UseSwitchRootArgs) {
  const isControlled = controlledChecked !== undefined;
  const [mirror, setMirror] = useState(defaultChecked ?? false);
  const checked = isControlled ? controlledChecked : mirror;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    if (event.defaultPrevented) return;
    const next = event.target.checked;
    // Stryker disable next-line ConditionalExpression: in controlled mode
    // `checked` reads controlledChecked, never `mirror`, so setting mirror here
    // (the mutant's always-run form) has no observable effect — equivalent.
    if (!isControlled) setMirror(next);
    onCheckedChange?.(next);
  };

  const inputStateProps = isControlled
    ? { checked: controlledChecked }
    : { defaultChecked: defaultChecked ?? false };

  return { checked, handleChange, inputStateProps };
}
