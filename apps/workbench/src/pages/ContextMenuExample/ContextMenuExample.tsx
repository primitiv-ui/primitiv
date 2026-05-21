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
              <ContextMenu.Separator />
              <ContextMenu.Sub>
                <ContextMenu.SubTrigger className="cm-sub-trigger">
                  Options
                  <span aria-hidden="true">{">"}</span>
                </ContextMenu.SubTrigger>
                <ContextMenu.SubContent className="cm-sub-content">
                  <ContextMenu.Sub>
                    <ContextMenu.SubTrigger className="cm-sub-trigger">
                      Format
                      <span aria-hidden="true">{">"}</span>
                    </ContextMenu.SubTrigger>
                    <ContextMenu.SubContent className="cm-sub-content">
                      <ContextMenu.Label className="cm-label">
                        Body format
                      </ContextMenu.Label>
                      <ContextMenu.RadioGroup
                        className="cm-radio-group"
                        defaultValue="html"
                      >
                        <ContextMenu.RadioItem
                          value="plain"
                          className="cm-radio-item"
                          onSelect={(event) => event.preventDefault()}
                        >
                          <ContextMenu.ItemIndicator className="cm-item-indicator">
                            <span aria-hidden="true">•</span>
                          </ContextMenu.ItemIndicator>
                          Plain text
                        </ContextMenu.RadioItem>
                        <ContextMenu.RadioItem
                          value="html"
                          className="cm-radio-item"
                          onSelect={(event) => event.preventDefault()}
                        >
                          <ContextMenu.ItemIndicator className="cm-item-indicator">
                            <span aria-hidden="true">•</span>
                          </ContextMenu.ItemIndicator>
                          HTML
                        </ContextMenu.RadioItem>
                        <ContextMenu.RadioItem
                          value="markdown"
                          className="cm-radio-item"
                          onSelect={(event) => event.preventDefault()}
                        >
                          <ContextMenu.ItemIndicator className="cm-item-indicator">
                            <span aria-hidden="true">•</span>
                          </ContextMenu.ItemIndicator>
                          Markdown
                        </ContextMenu.RadioItem>
                      </ContextMenu.RadioGroup>
                    </ContextMenu.SubContent>
                  </ContextMenu.Sub>
                  <ContextMenu.Separator />
                  <ContextMenu.CheckboxItem
                    className="cm-checkbox-item"
                    defaultChecked
                    onSelect={(event) => event.preventDefault()}
                  >
                    <ContextMenu.ItemIndicator className="cm-item-indicator">
                      <span aria-hidden="true">✓</span>
                    </ContextMenu.ItemIndicator>
                    Notify recipients
                  </ContextMenu.CheckboxItem>
                  <ContextMenu.CheckboxItem
                    className="cm-checkbox-item"
                    onSelect={(event) => event.preventDefault()}
                  >
                    <ContextMenu.ItemIndicator className="cm-item-indicator">
                      <span aria-hidden="true">✓</span>
                    </ContextMenu.ItemIndicator>
                    Track delivery
                  </ContextMenu.CheckboxItem>
                </ContextMenu.SubContent>
              </ContextMenu.Sub>
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
          <ContextMenu.Separator />
          <ContextMenu.CheckboxItem
            className="cm-checkbox-item"
            onSelect={(event) => event.preventDefault()}
          >
            <ContextMenu.ItemIndicator className="cm-item-indicator">
              <span aria-hidden="true">✓</span>
            </ContextMenu.ItemIndicator>
            Show bookmarks
          </ContextMenu.CheckboxItem>
          <ContextMenu.Separator />
          <ContextMenu.Label className="cm-label">Theme</ContextMenu.Label>
          <ContextMenu.RadioGroup
            className="cm-radio-group"
            defaultValue="system"
          >
            <ContextMenu.RadioItem
              value="light"
              className="cm-radio-item"
              onSelect={(event) => event.preventDefault()}
            >
              <ContextMenu.ItemIndicator className="cm-item-indicator">
                <span aria-hidden="true">•</span>
              </ContextMenu.ItemIndicator>
              Light
            </ContextMenu.RadioItem>
            <ContextMenu.RadioItem
              value="dark"
              className="cm-radio-item"
              onSelect={(event) => event.preventDefault()}
            >
              <ContextMenu.ItemIndicator className="cm-item-indicator">
                <span aria-hidden="true">•</span>
              </ContextMenu.ItemIndicator>
              Dark
            </ContextMenu.RadioItem>
            <ContextMenu.RadioItem
              value="system"
              className="cm-radio-item"
              onSelect={(event) => event.preventDefault()}
            >
              <ContextMenu.ItemIndicator className="cm-item-indicator">
                <span aria-hidden="true">•</span>
              </ContextMenu.ItemIndicator>
              Match system
            </ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
        </ContextMenu.Content>
      </ContextMenu.Root>
    </div>
  );
}
