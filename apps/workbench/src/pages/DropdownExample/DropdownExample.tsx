import { Dropdown, DirectionProvider } from "@primitiv/react";
import { useState } from "react";

import "./DropdownExample.scss";

export function DropdownExample() {
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");
  return (
    <div className="dd-page">
      <div className="dd-toolbar">
        <button
          type="button"
          className="dd-dir-toggle"
          onClick={() => setDir((d) => (d === "ltr" ? "rtl" : "ltr"))}
          aria-label={`Reading direction: ${dir.toUpperCase()}. Toggle.`}
        >
          dir: <strong>{dir.toUpperCase()}</strong>
        </button>
      </div>
      <DirectionProvider dir={dir}>
    <Dropdown.Root>
      <Dropdown.Trigger className="dd-trigger">Options</Dropdown.Trigger>
      <Dropdown.Content className="dd-content">
        <Dropdown.Item onSelect={() => console.log("Rename selected.")}>
          Rename
        </Dropdown.Item>
        <Dropdown.Item onSelect={() => console.log("Duplicate selected.")}>
          Duplicate
        </Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item disabled>Archive</Dropdown.Item>
        <Dropdown.Item>New</Dropdown.Item>
        <Dropdown.Sub>
          <Dropdown.SubTrigger className="dd-sub-trigger">
            Open Recent
            <span aria-hidden="true">{">"}</span>
          </Dropdown.SubTrigger>
          <Dropdown.SubContent className="dd-sub-content">
            <Dropdown.Item>Project A</Dropdown.Item>

            <Dropdown.Sub>
              <Dropdown.SubTrigger className="dd-sub-trigger">
                Project B<span aria-hidden="true">{">"}</span>
              </Dropdown.SubTrigger>
              <Dropdown.SubContent className="dd-sub-content">
                <Dropdown.Item>Example 1</Dropdown.Item>
                <Dropdown.Item>Example 2</Dropdown.Item>
              </Dropdown.SubContent>
            </Dropdown.Sub>
          </Dropdown.SubContent>
        </Dropdown.Sub>
        <Dropdown.Separator />
        <Dropdown.CheckboxItem className="dd-sub-checkbox-item">
          Show bookmarks
        </Dropdown.CheckboxItem>
        <Dropdown.Separator />
        <Dropdown.Label className="dd-label" aria-disabled>
          People
        </Dropdown.Label>
        <Dropdown.RadioGroup className="dd-sub-radio-group">
          <Dropdown.RadioItem
            value="Simon Revil"
            className="dd-sub-radio-group-item"
          >
            Simon Revill
          </Dropdown.RadioItem>
          <Dropdown.RadioItem
            value="David Beckham"
            className="dd-sub-radio-group-item"
          >
            David Beckham
          </Dropdown.RadioItem>
        </Dropdown.RadioGroup>
      </Dropdown.Content>
    </Dropdown.Root>
      </DirectionProvider>
    </div>
  );
}
