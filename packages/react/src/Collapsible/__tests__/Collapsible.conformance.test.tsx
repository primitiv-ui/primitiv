import { COLLAPSIBLE, runCollapsibleConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Collapsible } from "..";

// The React reference surface runs the shared Collapsible suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runCollapsibleConformance(async ({ open, disabled }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Collapsible.Root defaultOpen={open} disabled={disabled}>
        <Collapsible.Trigger>{COLLAPSIBLE.label}</Collapsible.Trigger>
        <Collapsible.Content>{COLLAPSIBLE.panel}</Collapsible.Content>
      </Collapsible.Root>,
    ));
  });
  return unmount;
});
