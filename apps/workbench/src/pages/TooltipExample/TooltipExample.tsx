import { useState } from "react";

import { Tooltip } from "@primitiv/react";

import "./TooltipExample.scss";

export function TooltipExample() {
  const [open, setOpen] = useState(false);

  return (
    <Tooltip.Provider>
      <section>
        <h2>Tooltip</h2>

        {/* ── 1. Basic ──────────────────────────────────────────────────── */}
        <h3>Basic</h3>
        <p>Hover or focus the button. The tooltip opens after the default 700 ms delay.</p>
        <Tooltip.Root>
          <Tooltip.Trigger className="tp-basic__trigger">Save</Tooltip.Trigger>
          <Tooltip.Content className="tp-basic__content">
            Save your changes (Ctrl+S)
          </Tooltip.Content>
        </Tooltip.Root>

        {/* ── 2. Multiple — skip-delay demo ─────────────────────────────── */}
        <h3>Multiple tooltips (skip-delay)</h3>
        <p>
          Hover the first button — it opens after the delay. Then quickly move
          to the second and third. Each opens instantly because the skip window
          is still active.
        </p>
        <div className="tp-multi">
          <Tooltip.Root>
            <Tooltip.Trigger className="tp-multi__trigger-a">Cut</Tooltip.Trigger>
            <Tooltip.Content className="tp-multi__content-a">Cut (Ctrl+X)</Tooltip.Content>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger className="tp-multi__trigger-b">Copy</Tooltip.Trigger>
            <Tooltip.Content className="tp-multi__content-b">Copy (Ctrl+C)</Tooltip.Content>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger className="tp-multi__trigger-c">Paste</Tooltip.Trigger>
            <Tooltip.Content className="tp-multi__content-c">Paste (Ctrl+V)</Tooltip.Content>
          </Tooltip.Root>
        </div>

        {/* ── 3. With arrow ─────────────────────────────────────────────── */}
        <h3>With arrow</h3>
        <p>An optional arrow element connects the content to its trigger.</p>
        <Tooltip.Root>
          <Tooltip.Trigger className="tp-arrow__trigger">Help</Tooltip.Trigger>
          <Tooltip.Content className="tp-arrow__content">
            Learn more about this feature
            <Tooltip.Arrow className="tp-arrow__arrow" />
          </Tooltip.Content>
        </Tooltip.Root>

        {/* ── 4. Placement variations ───────────────────────────────────── */}
        <h3>Placement</h3>
        <p>
          CSS <code>position-area</code> controls where the tooltip opens.
          The first button anchors above; the second anchors below.
        </p>
        <div className="tp-placement">
          <Tooltip.Root>
            <Tooltip.Trigger className="tp-placement__trigger-top">Top</Tooltip.Trigger>
            <Tooltip.Content className="tp-placement__content-top">
              Positioned above via position-area: top
            </Tooltip.Content>
          </Tooltip.Root>
          <Tooltip.Root>
            <Tooltip.Trigger className="tp-placement__trigger-bottom">Bottom</Tooltip.Trigger>
            <Tooltip.Content className="tp-placement__content-bottom">
              Positioned below via position-area: bottom
            </Tooltip.Content>
          </Tooltip.Root>
        </div>

        {/* ── 5. Controlled ─────────────────────────────────────────────── */}
        <h3>Controlled</h3>
        <p>Open state is managed externally via <code>open</code> / <code>onOpenChange</code>.</p>
        <div className="tp-controlled">
          <Tooltip.Root open={open} onOpenChange={setOpen}>
            <Tooltip.Trigger className="tp-controlled__trigger">
              Hover or focus me
            </Tooltip.Trigger>
            <Tooltip.Content className="tp-controlled__content">
              Controlled tooltip — state lives outside the component
            </Tooltip.Content>
          </Tooltip.Root>
          <button
            className="tp-controlled__toggle"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close tooltip" : "Open tooltip"}
          </button>
        </div>
      </section>
    </Tooltip.Provider>
  );
}
