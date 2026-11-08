import { runTabsConformance, TABS } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Tabs } from "..";

// The React reference surface runs the shared Tabs suite (RFC 0033 §6.2). It is
// expected to pass here first: React is the implementation the suite describes,
// so a failure is a real React bug, fixed in its own cycle.
runTabsConformance(async ({ value, orientation, activationMode, dir, disabled = [], label }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Tabs.Root defaultValue={value} orientation={orientation} activationMode={activationMode} dir={dir}>
        <Tabs.List label={label}>
          {TABS.map((tab) => (
            <Tabs.Trigger key={tab.value} value={tab.value} disabled={disabled.includes(tab.value)}>
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {TABS.map((tab) => (
          <Tabs.Content key={tab.value} value={tab.value}>
            {tab.panel}
          </Tabs.Content>
        ))}
      </Tabs.Root>,
    ));
  });
  return unmount;
});
