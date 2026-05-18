import { Tabs } from "@primitiv/react";

import "./TabsExample.scss";

export function TabsExample() {
  return (
    <div className="tabs-example">
      <h2 className="tabs-example__title">Tabs</h2>

      <section className="tabs-example__section">
        <h3 className="tabs-example__section-title">
          Automatic activation
        </h3>
        <p className="tabs-example__description">
          Arrow keys move focus and activate the panel immediately.
        </p>
        <Tabs.Root defaultValue="overview">
          <Tabs.List className="tabs-example__list" label="Account sections">
            <Tabs.Trigger className="tabs-example__trigger" value="overview">
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-example__trigger" value="settings">
              Settings
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-example__trigger" value="billing">
              Billing
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="tabs-example__panel" value="overview">
            Dashboard summary and recent activity.
          </Tabs.Content>
          <Tabs.Content className="tabs-example__panel" value="settings">
            Profile preferences and notification options.
          </Tabs.Content>
          <Tabs.Content className="tabs-example__panel" value="billing">
            Invoices, payment methods, and plan details.
          </Tabs.Content>
        </Tabs.Root>
      </section>

      <section className="tabs-example__section">
        <h3 className="tabs-example__section-title">Manual activation</h3>
        <p className="tabs-example__description">
          Arrow keys move focus only; <code>Enter</code> / <code>Space</code>{" "}
          confirms the selection.
        </p>
        <Tabs.Root defaultValue="first" activationMode="manual">
          <Tabs.List className="tabs-example__list" label="Manual tabs">
            <Tabs.Trigger className="tabs-example__trigger" value="first">
              First
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-example__trigger" value="second">
              Second
            </Tabs.Trigger>
            <Tabs.Trigger className="tabs-example__trigger" value="third">
              Third
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="tabs-example__panel" value="first">
            First panel content.
          </Tabs.Content>
          <Tabs.Content className="tabs-example__panel" value="second">
            Second panel content.
          </Tabs.Content>
          <Tabs.Content className="tabs-example__panel" value="third">
            Third panel content.
          </Tabs.Content>
        </Tabs.Root>
      </section>
    </div>
  );
}
