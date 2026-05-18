import { useState } from "react";

import { ToggleGroup } from "@primitiv/react";

import "./ToggleGroupExample.scss";

export function ToggleGroupExample() {
  const [align, setAlign] = useState<string | undefined>("left");
  const [formats, setFormats] = useState<string[]>(["bold"]);

  return (
    <div className="toggle-group-example">
      <h2 className="toggle-group-example__title">Toggle Group</h2>

      <section className="toggle-group-example__section">
        <h3 className="toggle-group-example__section-title">
          Single — text alignment (controlled)
        </h3>
        <p className="toggle-group-example__description">
          At most one item active. Clicking the active item deselects it.
          Current value:{" "}
          <span className="toggle-group-example__value">
            {align ?? "none"}
          </span>
        </p>
        <ToggleGroup.Root
          type="single"
          value={align}
          onValueChange={setAlign}
          aria-label="Text alignment"
          className="toggle-group"
        >
          <ToggleGroup.Item value="left" className="toggle-group__item" aria-label="Align left">
            &#8676;
          </ToggleGroup.Item>
          <ToggleGroup.Item value="center" className="toggle-group__item" aria-label="Align center">
            &#8596;
          </ToggleGroup.Item>
          <ToggleGroup.Item value="right" className="toggle-group__item" aria-label="Align right">
            &#8677;
          </ToggleGroup.Item>
          <ToggleGroup.Item value="justify" className="toggle-group__item" aria-label="Justify">
            &#8660;
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>

      <section className="toggle-group-example__section">
        <h3 className="toggle-group-example__section-title">
          Multiple — text formatting (controlled)
        </h3>
        <p className="toggle-group-example__description">
          Any number of items can be active simultaneously. Current value:{" "}
          <span className="toggle-group-example__value">
            {formats.length > 0 ? formats.join(", ") : "none"}
          </span>
        </p>
        <ToggleGroup.Root
          type="multiple"
          value={formats}
          onValueChange={setFormats}
          aria-label="Text formatting"
          className="toggle-group"
        >
          <ToggleGroup.Item value="bold" className="toggle-group__item" aria-label="Bold">
            <strong>B</strong>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="italic" className="toggle-group__item" aria-label="Italic">
            <em>I</em>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="underline" className="toggle-group__item" aria-label="Underline">
            <span style={{ textDecoration: "underline" }}>U</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="strikethrough" className="toggle-group__item" aria-label="Strikethrough">
            <span style={{ textDecoration: "line-through" }}>S</span>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>

      <section className="toggle-group-example__section">
        <h3 className="toggle-group-example__section-title">
          With disabled items
        </h3>
        <p className="toggle-group-example__description">
          Disabled items are skipped in keyboard navigation.
        </p>
        <ToggleGroup.Root
          type="single"
          defaultValue="left"
          aria-label="Text alignment (restricted)"
          className="toggle-group"
        >
          <ToggleGroup.Item value="left" className="toggle-group__item" aria-label="Align left">
            &#8676;
          </ToggleGroup.Item>
          <ToggleGroup.Item value="center" className="toggle-group__item" aria-label="Align center" disabled>
            &#8596;
          </ToggleGroup.Item>
          <ToggleGroup.Item value="right" className="toggle-group__item" aria-label="Align right">
            &#8677;
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>

      <section className="toggle-group-example__section">
        <h3 className="toggle-group-example__section-title">
          Vertical orientation
        </h3>
        <ToggleGroup.Root
          type="single"
          defaultValue="compact"
          orientation="vertical"
          aria-label="Density"
          className="toggle-group toggle-group--vertical"
        >
          <ToggleGroup.Item value="compact" className="toggle-group__item toggle-group__item--wide" aria-label="Compact">
            Compact
          </ToggleGroup.Item>
          <ToggleGroup.Item value="comfortable" className="toggle-group__item toggle-group__item--wide" aria-label="Comfortable">
            Comfortable
          </ToggleGroup.Item>
          <ToggleGroup.Item value="spacious" className="toggle-group__item toggle-group__item--wide" aria-label="Spacious">
            Spacious
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </section>
    </div>
  );
}
