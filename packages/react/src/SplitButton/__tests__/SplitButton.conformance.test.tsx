import { runSplitButtonConformance, SPLIT_BUTTON } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { SplitButton } from "..";

// The React reference surface runs the shared SplitButton suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runSplitButtonConformance(async ({ disabled, actionDisabled, triggerDisabled, triggerLabel }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <SplitButton disabled={disabled}>
        <SplitButton.Action disabled={actionDisabled}>{SPLIT_BUTTON.action}</SplitButton.Action>
        <SplitButton.Trigger disabled={triggerDisabled} aria-label={triggerLabel}>
          {SPLIT_BUTTON.trigger}
        </SplitButton.Trigger>
        <SplitButton.Menu>
          <SplitButton.Item>{SPLIT_BUTTON.first}</SplitButton.Item>
          <SplitButton.Item>{SPLIT_BUTTON.second}</SplitButton.Item>
        </SplitButton.Menu>
      </SplitButton>,
    ));
  });
  return unmount;
});
