import { useState } from "react";

import { Popover } from "@primitiv-ui/react";

import "./PopoverExample.css";

export function PopoverExample() {
  const [open, setOpen] = useState(false);

  return (
    <section>
      <h2>Popover</h2>
      <p>
        A non-modal dialog built on the native HTML Popover API. The browser
        owns the top layer and light-dismiss; placement is CSS anchor
        positioning. The page stays interactive — there is no focus trap.
      </p>

      {/* ── 1. Basic ──────────────────────────────────────────────────── */}
      <h3>Basic</h3>
      <p>Click the trigger to open. Click outside, or press Escape, to close.</p>
      <Popover.Root>
        <Popover.Trigger className="pop-basic__trigger">Filters</Popover.Trigger>
        <Popover.Content className="pop-basic__content">
          <Popover.Title className="pop__title">Filters</Popover.Title>
          <Popover.Description className="pop__description">
            Narrow the results below.
          </Popover.Description>
          <label className="pop__field">
            <input type="checkbox" /> In stock only
          </label>
          <Popover.Close className="pop__close">Done</Popover.Close>
        </Popover.Content>
      </Popover.Root>

      {/* ── 2. Anchored to a field group ──────────────────────────────── */}
      <h3>Anchor</h3>
      <p>
        <code>Popover.Anchor</code> positions the panel against a wrapping
        element rather than the small trigger button inside it.
      </p>
      <Popover.Root>
        <Popover.Anchor asChild>
          <div className="pop-anchor__field">
            <input aria-label="Amount" placeholder="Amount" />
            <Popover.Trigger className="pop-anchor__trigger" aria-label="Options">
              ▾
            </Popover.Trigger>
          </div>
        </Popover.Anchor>
        <Popover.Content className="pop-anchor__content">
          <Popover.Title className="pop__title">Amount options</Popover.Title>
          <button type="button">Set to maximum</button>
          <Popover.Close className="pop__close">Close</Popover.Close>
        </Popover.Content>
      </Popover.Root>

      {/* ── 3. Placement ──────────────────────────────────────────────── */}
      <h3>Placement</h3>
      <p>
        CSS <code>position-area</code> controls where the panel opens — this one
        anchors to the right of its trigger.
      </p>
      <Popover.Root>
        <Popover.Trigger className="pop-side__trigger">Open to the side</Popover.Trigger>
        <Popover.Content className="pop-side__content">
          <Popover.Title className="pop__title">Side panel</Popover.Title>
          <Popover.Description className="pop__description">
            Positioned with <code>position-area: right</code>.
          </Popover.Description>
          <Popover.Close className="pop__close">Close</Popover.Close>
        </Popover.Content>
      </Popover.Root>

      {/* ── 4. Controlled ─────────────────────────────────────────────── */}
      <h3>Controlled</h3>
      <p>
        Open state is managed externally via <code>open</code> /{" "}
        <code>onOpenChange</code>.
      </p>
      <div className="pop-controlled">
        <Popover.Root open={open} onOpenChange={setOpen}>
          <Popover.Trigger className="pop-controlled__trigger">
            Account
          </Popover.Trigger>
          <Popover.Content className="pop-controlled__content">
            <Popover.Title className="pop__title">Account</Popover.Title>
            <Popover.Description className="pop__description">
              Controlled — state lives outside the component.
            </Popover.Description>
            <Popover.Close className="pop__close">Close</Popover.Close>
          </Popover.Content>
        </Popover.Root>
        <button
          type="button"
          className="pop-controlled__toggle"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close from outside" : "Open from outside"}
        </button>
      </div>

      {/* ── 5. asChild trigger ────────────────────────────────────────── */}
      <h3>asChild trigger</h3>
      <p>
        The trigger renders a consumer element (here a link) with the popover
        ARIA and toggle merged in.
      </p>
      <Popover.Root>
        <Popover.Trigger<HTMLAnchorElement> asChild>
          <a href="#more" className="pop-aschild__trigger">
            More info
          </a>
        </Popover.Trigger>
        <Popover.Content className="pop-aschild__content">
          <Popover.Description className="pop__description">
            Rendered from an anchor via <code>asChild</code>.
          </Popover.Description>
          <Popover.Close className="pop__close">Got it</Popover.Close>
        </Popover.Content>
      </Popover.Root>
    </section>
  );
}
