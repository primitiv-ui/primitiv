import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { render } from "@testing-library/react";

import { Table } from "../Table";

/**
 * Auto-verification of the Table styling contract (RFC 0004 §3.4 / D15). The
 * `data-*` half of `registry/components/table/contract.json` is *derived from and
 * asserted against the rendered headless component* so it can never drift from
 * what the component actually emits. Table is a **static** structural compound:
 * it carries no state, so neither the root nor any part emits a `data-*` — the
 * guard pins that emptiness across every part.
 */
const contractPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../../registry/components/table/contract.json",
);

const contract = JSON.parse(readFileSync(contractPath, "utf8"));

type DataAttribute = { name: string; value: string; when: string; source: string };

/** Every `data-*` attribute name present anywhere in a subtree. */
function dataAttributeNames(root: Element): string[] {
  return [
    ...new Set(
      [root, ...root.querySelectorAll("*")].flatMap((element) =>
        [...element.attributes]
          .map((attribute) => attribute.name)
          .filter((name) => name.startsWith("data-")),
      ),
    ),
  ].sort();
}

function renderTable() {
  return render(
    <Table.Root>
      <Table.Caption>Team</Table.Caption>
      <Table.Head>
        <Table.Row>
          <Table.Header scope="col">Name</Table.Header>
          <Table.Header scope="col">Role</Table.Header>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <Table.Row aria-selected="true">
          <Table.Cell>Alice</Table.Cell>
          <Table.Cell>Engineer</Table.Cell>
        </Table.Row>
      </Table.Body>
      <Table.Footer>
        <Table.Row>
          <Table.Cell>Total</Table.Cell>
          <Table.Cell>1</Table.Cell>
        </Table.Row>
      </Table.Footer>
    </Table.Root>,
  );
}

describe("Table styling contract", () => {
  it("declares every data-* attribute on every part as auto-verified", () => {
    const all: DataAttribute[] = [
      ...contract.dataAttributes,
      ...contract.subcomponents.flatMap(
        (sub: { dataAttributes: DataAttribute[] }) => sub.dataAttributes,
      ),
    ];
    expect(all.every((attribute) => attribute.source === "auto")).toBe(true);
  });

  it("emits no data-* attributes on the root or any part", () => {
    const { container } = renderTable();
    expect(dataAttributeNames(container.firstElementChild as Element)).toEqual([]);
  });
});
