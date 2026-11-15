import { runTableExpandConformance, TABLE_EXPAND_ROWS } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { Table } from "..";

// The React reference surface runs the shared expandable-row suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runTableExpandConformance(async ({ expanded = [], forceMount }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <Table.Root>
        <Table.Body>
          {TABLE_EXPAND_ROWS.map((name) => (
            <Table.Expandable key={name} defaultExpanded={expanded.includes(name)}>
              <Table.Row>
                <Table.Cell>
                  <Table.ExpandTrigger>Show details for {name}</Table.ExpandTrigger>
                </Table.Cell>
                <Table.Cell>{name}</Table.Cell>
              </Table.Row>
              <Table.DetailRow colSpan={2} forceMount={forceMount}>
                {name}&apos;s details
              </Table.DetailRow>
            </Table.Expandable>
          ))}
        </Table.Body>
      </Table.Root>,
    ));
  });
  return () => unmount();
});
