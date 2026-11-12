import { COMBOBOX_ITEMS, runComboboxConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Combobox } from "..";

// The React surface runs the shared Combobox suite (RFC 0033 §6.2). Filtering
// is consumer-owned, so every item is rendered whatever the query.
runComboboxConformance(async ({ label }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Combobox.Root>
        <Combobox.Input aria-label={label} />
        <Combobox.Content aria-label="Frameworks">
          {COMBOBOX_ITEMS.map((item) => (
            <Combobox.Item key={item.value} value={item.value}>
              {item.label}
            </Combobox.Item>
          ))}
        </Combobox.Content>
      </Combobox.Root>,
    ));
  });
  return unmount;
});
