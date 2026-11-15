import { runTreeConformance, TREE } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";
import { Fragment, type ReactNode } from "react";

import { Tree } from "..";

// The React reference surface runs the shared Tree suite (RFC 0033 §6.2). It is
// expected to pass here first: React is the implementation the suite
// describes, so a failure is a real React bug, fixed in its own cycle.
runTreeConformance(async ({ expanded, selected = [], multiple, disabled = [], selectionPath }) => {
  const off = (value: string) => disabled.includes(value);
  const leaf = (label: string) => (
    <Tree.Item value={label.toLowerCase()} label={label} disabled={off(label.toLowerCase())}>
      {label}
    </Tree.Item>
  );
  const branch = (label: string, children: ReactNode) => (
    <Tree.Branch value={label.toLowerCase()} label={label} disabled={off(label.toLowerCase())}>
      <Tree.BranchControl>{label}</Tree.BranchControl>
      <Tree.BranchContent>{children}</Tree.BranchContent>
    </Tree.Branch>
  );
  const selection = multiple
    ? ({ selectionMode: "multiple", defaultSelectedValues: selected } as const)
    : ({ selectionMode: "single", defaultSelectedValue: selected[0] ?? null } as const);
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <>
        <Tree.Root aria-label="Site" defaultExpandedValues={expanded} {...selection}>
          {branch("Docs", [
            <Fragment key="g">{branch("Guides", [<Fragment key="i">{leaf("Intro")}</Fragment>, <Fragment key="s">{leaf("Setup")}</Fragment>])}</Fragment>,
            <Fragment key="a">{leaf("API")}</Fragment>,
          ])}
          {leaf("Blog")}
          {selectionPath && <Tree.SelectionPath />}
        </Tree.Root>
        <button type="button">{TREE.outside}</button>
      </>,
    ));
  });
  return unmount;
});
