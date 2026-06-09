import { Table } from "@primitiv-ui/react";

import "./TableExample.css";

const members = [
  { name: "Alice", role: "Engineer", location: "London" },
  { name: "Bob", role: "Designer", location: "Berlin" },
  { name: "Carmen", role: "Product", location: "Madrid" },
];

export function TableExample() {
  return (
    <div className="table-example">
      <h2 className="table-example__title">Table</h2>

      <section className="table-example__section">
        <h3 className="table-example__section-title">
          Caption, headers, footer
        </h3>
        <p className="table-example__description">
          Wrapped in <code>Table.ScrollArea</code> for horizontal scrolling
          on narrow viewports.
        </p>
        <Table.ScrollArea>
          <Table.Root className="table-example__table">
            <Table.Caption captionSide="top">Team members</Table.Caption>
            <Table.Head>
              <Table.Row>
                <Table.Header scope="col">Name</Table.Header>
                <Table.Header scope="col">Role</Table.Header>
                <Table.Header scope="col">Location</Table.Header>
              </Table.Row>
            </Table.Head>
            <Table.Body>
              {members.map((member) => (
                <Table.Row key={member.name}>
                  <Table.Header scope="row">{member.name}</Table.Header>
                  <Table.Cell>{member.role}</Table.Cell>
                  <Table.Cell>{member.location}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
            <Table.Footer>
              <Table.Row>
                <Table.Cell colSpan={3}>
                  {members.length} team members
                </Table.Cell>
              </Table.Row>
            </Table.Footer>
          </Table.Root>
        </Table.ScrollArea>
      </section>
    </div>
  );
}
