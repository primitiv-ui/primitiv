import { CONTEXT_MENU, runContextMenuConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { ContextMenu } from "..";

// The React reference surface runs the shared Context Menu suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runContextMenuConformance(async ({ open, disabled }) => {
  let unmount = () => {};
  await act(async () => {
    ({ unmount } = render(
      <>
        <ContextMenu.Root defaultOpen={open}>
          <ContextMenu.Trigger disabled={disabled}>{CONTEXT_MENU.region}</ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item>{CONTEXT_MENU.copy}</ContextMenu.Item>
            <ContextMenu.Item disabled>{CONTEXT_MENU.cut}</ContextMenu.Item>
            <ContextMenu.CheckboxItem>{CONTEXT_MENU.grid}</ContextMenu.CheckboxItem>
            <ContextMenu.RadioGroup defaultValue="small">
              <ContextMenu.RadioItem value="small">{CONTEXT_MENU.small}</ContextMenu.RadioItem>
              <ContextMenu.RadioItem value="large">{CONTEXT_MENU.large}</ContextMenu.RadioItem>
            </ContextMenu.RadioGroup>
            <ContextMenu.Sub>
              <ContextMenu.SubTrigger>{CONTEXT_MENU.share}</ContextMenu.SubTrigger>
              <ContextMenu.SubContent>
                <ContextMenu.Item>{CONTEXT_MENU.email}</ContextMenu.Item>
                <ContextMenu.Item>{CONTEXT_MENU.link}</ContextMenu.Item>
              </ContextMenu.SubContent>
            </ContextMenu.Sub>
            <ContextMenu.Item>{CONTEXT_MENU.remove}</ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
        <button type="button">{CONTEXT_MENU.outside}</button>
      </>,
    ));
  });
  return unmount;
});
