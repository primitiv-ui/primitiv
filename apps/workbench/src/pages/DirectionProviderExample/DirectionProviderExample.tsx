import { useState } from "react";

import {
  DirectionProvider,
  Fieldset,
  Tabs,
  useDirection,
} from "@primitiv-ui/react";

import "./DirectionProviderExample.css";

function InheritedDirection() {
  const dir = useDirection();
  return (
    <p className="dp-example__readout">
      <code>useDirection()</code> here returns <strong>{dir}</strong>
    </p>
  );
}

export function DirectionProviderExample() {
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  return (
    <div className="dp-example">
      <h2 className="dp-example__title">Direction Provider</h2>
      <p className="dp-example__description">
        <code>DirectionProvider</code> broadcasts a reading direction to every
        descendant. Toggle it below — components that read direction from
        context, and any <code>useDirection</code> consumer, follow along
        without each being passed an explicit <code>dir</code> prop.
      </p>

      <Fieldset.Root className="dp-example__controls">
        <Fieldset.Legend className="dp-example__legend">
          Provider direction
        </Fieldset.Legend>
        <label className="dp-example__radio">
          <input
            type="radio"
            name="dp-dir"
            value="ltr"
            checked={dir === "ltr"}
            onChange={() => setDir("ltr")}
          />
          ltr
        </label>
        <label className="dp-example__radio">
          <input
            type="radio"
            name="dp-dir"
            value="rtl"
            checked={dir === "rtl"}
            onChange={() => setDir("rtl")}
          />
          rtl
        </label>
      </Fieldset.Root>

      <DirectionProvider dir={dir}>
        <section className="dp-example__section">
          <h3 className="dp-example__section-title">useDirection</h3>
          <InheritedDirection />
        </section>

        <section className="dp-example__section">
          <h3 className="dp-example__section-title">
            Inherited by a component
          </h3>
          <p className="dp-example__description">
            This <code>Tabs</code> receives no <code>dir</code> prop — it
            inherits the direction from the provider. Arrow-key navigation
            follows the direction.
          </p>
          <Tabs.Root defaultValue="overview">
            <Tabs.List className="dp-example__tabs-list" label="Sections">
              <Tabs.Trigger className="dp-example__tab" value="overview">
                Overview
              </Tabs.Trigger>
              <Tabs.Trigger className="dp-example__tab" value="settings">
                Settings
              </Tabs.Trigger>
              <Tabs.Trigger className="dp-example__tab" value="billing">
                Billing
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content className="dp-example__panel" value="overview">
              Overview panel.
            </Tabs.Content>
            <Tabs.Content className="dp-example__panel" value="settings">
              Settings panel.
            </Tabs.Content>
            <Tabs.Content className="dp-example__panel" value="billing">
              Billing panel.
            </Tabs.Content>
          </Tabs.Root>
        </section>

        <section className="dp-example__section">
          <h3 className="dp-example__section-title">Explicit dir wins</h3>
          <p className="dp-example__description">
            A component's own <code>dir</code> prop overrides the provider. This{" "}
            <code>Tabs</code> is pinned <code>ltr</code> regardless of the
            toggle.
          </p>
          <Tabs.Root dir="ltr" defaultValue="one">
            <Tabs.List className="dp-example__tabs-list" label="Pinned">
              <Tabs.Trigger className="dp-example__tab" value="one">
                One
              </Tabs.Trigger>
              <Tabs.Trigger className="dp-example__tab" value="two">
                Two
              </Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content className="dp-example__panel" value="one">
              First panel.
            </Tabs.Content>
            <Tabs.Content className="dp-example__panel" value="two">
              Second panel.
            </Tabs.Content>
          </Tabs.Root>
        </section>
      </DirectionProvider>
    </div>
  );
}
