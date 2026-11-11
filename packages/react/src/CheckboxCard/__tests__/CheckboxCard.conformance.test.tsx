import { CHECKBOX_CARD_LABEL, runCheckboxCardConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { CheckboxCard } from "..";

// The React reference surface runs the shared CheckboxCard suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runCheckboxCardConformance(async ({ checked, disabled, forceMount }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <CheckboxCard.Root defaultChecked={checked} disabled={disabled}>
        <CheckboxCard.Indicator forceMount={forceMount} />
        {CHECKBOX_CARD_LABEL}
      </CheckboxCard.Root>,
    ));
  });
  return unmount;
});
