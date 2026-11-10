import { runTooltipConformance, TOOLTIP } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Tooltip } from "..";

// The React reference surface runs the shared Tooltip suite (RFC 0033 §6.2).
// It is expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runTooltipConformance(async ({ open }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Tooltip.Provider delayDuration={0}>
        <Tooltip.Root defaultOpen={open}>
          <Tooltip.Trigger>{TOOLTIP.label}</Tooltip.Trigger>
          <Tooltip.Content>{TOOLTIP.tip}</Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>,
    ));
  });
  return unmount;
});
