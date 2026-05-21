import { ContextMenu } from "@primitiv/react";

import "./ContextMenuExample.scss";

export function ContextMenuExample() {
  return (
    <div className="cm-page">
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div className="cm-canvas">
            Right-click anywhere inside this area to open the context menu.
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Content className="cm-content">
          <ContextMenu.Item onSelect={() => console.log("Cut selected.")}>
            Cut
          </ContextMenu.Item>
          <ContextMenu.Item onSelect={() => console.log("Copy selected.")}>
            Copy
          </ContextMenu.Item>
          <ContextMenu.Item onSelect={() => console.log("Paste selected.")}>
            Paste
          </ContextMenu.Item>
          <ContextMenu.Separator />
          <ContextMenu.Item disabled>Archive</ContextMenu.Item>
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger className="cm-sub-trigger">
              Share
              <span aria-hidden="true">{">"}</span>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent className="cm-sub-content">
              <ContextMenu.Item>Email</ContextMenu.Item>
              <ContextMenu.Item>Copy link</ContextMenu.Item>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
          <ContextMenu.Separator />
          <ContextMenu.CheckboxItem className="cm-checkbox-item">
            Show bookmarks
          </ContextMenu.CheckboxItem>
          <ContextMenu.Separator />
          <ContextMenu.Label className="cm-label">Theme</ContextMenu.Label>
          <ContextMenu.RadioGroup className="cm-radio-group" defaultValue="system">
            <ContextMenu.RadioItem value="light" className="cm-radio-item">
              Light
            </ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="dark" className="cm-radio-item">
              Dark
            </ContextMenu.RadioItem>
            <ContextMenu.RadioItem value="system" className="cm-radio-item">
              Match system
            </ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </div>
  );
}
