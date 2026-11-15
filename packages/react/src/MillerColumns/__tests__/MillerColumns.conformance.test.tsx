import { MILLER_COLUMNS, runMillerColumnsConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { MillerColumns } from "..";

// The React reference surface runs the shared Miller Columns suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runMillerColumnsConformance(async ({ value, disabled = [], dir, preview, resize }) => {
  const node = (label: string, children?: ReactNode) => (
    <MillerColumns.Item key={label} value={label.toLowerCase()} disabled={disabled.includes(label.toLowerCase())}>
      {label}
      {children ? (
        <>
          <MillerColumns.ItemIndicator>▸</MillerColumns.ItemIndicator>
          <MillerColumns.Column>{children}</MillerColumns.Column>
        </>
      ) : null}
    </MillerColumns.Item>
  );
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <MillerColumns.Root aria-label={MILLER_COLUMNS.label} defaultValue={value} dir={dir}>
        <MillerColumns.Column>
          {resize ? (
            <MillerColumns.ResizeHandle aria-label={MILLER_COLUMNS.handle} minWidth={120} maxWidth={400} step={10} />
          ) : null}
          {node("Docs", [node("Guides", [node("Intro"), node("Setup")]), node("API")])}
          {node("Blog", [node("Post")])}
          {node("Readme")}
        </MillerColumns.Column>
        {preview ? <MillerColumns.PreviewPanel>{MILLER_COLUMNS.preview}</MillerColumns.PreviewPanel> : null}
      </MillerColumns.Root>,
    ));
  });
  return () => unmount();
});
