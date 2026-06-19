import { Check } from "@primitiv-ui/icons";
import { Tabs } from "@primitiv-ui/react";

import "./TabsExample.css";
// The canonical per-component default theme straight from the registry — the
// same bytes `primitiv add tabs` copies into a consumer repo. Tabs is the first
// structural compound (RFC 0004 §3, D56): the enclosed style styles the
// `.primitiv-tabs` / `__list` / `__trigger` / `__panel` contract classes applied
// below, resolving against the app-level Primitiv token layer (imported in
// main.tsx).
import "../../../../../registry/components/tabs/styles.css";

const DENSITIES = ["dense", "compact", "comfortable", "spacious"] as const;
const JUSTIFY = ["start", "center", "end"] as const;

export function TabsExample() {
  return (
    <div className="tabs-example">
      <h2 className="tabs-example__title">Tabs</h2>

      <section className="tabs-example__section">
        <h3 className="tabs-example__section-title">
          Default theme — styling contract
        </h3>
        <p className="tabs-example__description">
          The headless <code>Tabs</code> with the registry{" "}
          <code>.primitiv-tabs</code> contract classes applied — the enclosed
          style: triggers are framed controls forming a connected strip,{" "}
          <code>action/primary</code> when active and <code>action/secondary</code>{" "}
          when inactive, with the panel butting flush below. Corner-clamping is
          structural (<code>:first-child</code> / <code>:last-child</code>), the
          icon sits in the trigger&rsquo;s leading slot, and a disabled trigger
          dims via <code>data-disabled</code>.
        </p>
        <Tabs.Root className="primitiv-tabs primitiv-tabs--md" defaultValue="overview">
          <Tabs.List
            className="primitiv-tabs__list primitiv-tabs__list--start"
            label="Account sections"
          >
            <Tabs.Trigger className="primitiv-tabs__trigger" value="overview">
              <Check aria-hidden />
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger className="primitiv-tabs__trigger" value="settings">
              Settings
            </Tabs.Trigger>
            <Tabs.Trigger className="primitiv-tabs__trigger" value="billing" disabled>
              Billing
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="primitiv-tabs__panel" value="overview">
            Dashboard summary and recent activity.
          </Tabs.Content>
          <Tabs.Content className="primitiv-tabs__panel" value="settings">
            Profile preferences and notification options.
          </Tabs.Content>
          <Tabs.Content className="primitiv-tabs__panel" value="billing">
            Invoices, payment methods, and plan details.
          </Tabs.Content>
        </Tabs.Root>
      </section>

      <section className="tabs-example__section">
        <h3 className="tabs-example__section-title">Justify</h3>
        <p className="tabs-example__description">
          The <code>justify</code> modifier aligns the trigger strip along the
          tablist. It is flow-relative, so <code>start</code> / <code>end</code>{" "}
          follow the reading direction and flip under RTL.
        </p>
        {JUSTIFY.map((justify) => (
          <div key={justify} className="tabs-example__justify">
            <span className="tabs-example__row-label">{justify}</span>
            <Tabs.Root
              className="primitiv-tabs primitiv-tabs--md"
              defaultValue="one"
            >
              <Tabs.List
                className={`primitiv-tabs__list primitiv-tabs__list--${justify}`}
                label={`Justify ${justify}`}
              >
                <Tabs.Trigger className="primitiv-tabs__trigger" value="one">
                  One
                </Tabs.Trigger>
                <Tabs.Trigger className="primitiv-tabs__trigger" value="two">
                  Two
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content className="primitiv-tabs__panel" value="one">
                First panel.
              </Tabs.Content>
              <Tabs.Content className="primitiv-tabs__panel" value="two">
                Second panel.
              </Tabs.Content>
            </Tabs.Root>
          </div>
        ))}
      </section>

      <section className="tabs-example__section">
        <h3 className="tabs-example__section-title">Density</h3>
        <p className="tabs-example__description">
          The same contract-styled tabs under each <code>data-density</code>{" "}
          scope. Density is ambient — set on any ancestor — and the{" "}
          <code>framed-control/*</code> anatomy tokens resolve to the matching
          scale (RFC 0009).
        </p>
        {DENSITIES.map((density) => (
          <div
            key={density}
            data-density={density}
            className="tabs-example__density"
          >
            <span className="tabs-example__row-label">{density}</span>
            <Tabs.Root
              className="primitiv-tabs primitiv-tabs--md"
              defaultValue="overview"
            >
              <Tabs.List
                className="primitiv-tabs__list primitiv-tabs__list--start"
                label={`Density ${density}`}
              >
                <Tabs.Trigger className="primitiv-tabs__trigger" value="overview">
                  Overview
                </Tabs.Trigger>
                <Tabs.Trigger className="primitiv-tabs__trigger" value="settings">
                  Settings
                </Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content className="primitiv-tabs__panel" value="overview">
                Dashboard summary.
              </Tabs.Content>
              <Tabs.Content className="primitiv-tabs__panel" value="settings">
                Profile preferences.
              </Tabs.Content>
            </Tabs.Root>
          </div>
        ))}
      </section>

      <section className="tabs-example__section">
        <h3 className="tabs-example__section-title">Automatic activation</h3>
        <p className="tabs-example__description">
          Arrow keys move focus and activate the panel immediately.
        </p>
        <Tabs.Root className="primitiv-tabs primitiv-tabs--md" defaultValue="overview">
          <Tabs.List
            className="primitiv-tabs__list primitiv-tabs__list--start"
            label="Account sections"
          >
            <Tabs.Trigger className="primitiv-tabs__trigger" value="overview">
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger className="primitiv-tabs__trigger" value="settings">
              Settings
            </Tabs.Trigger>
            <Tabs.Trigger className="primitiv-tabs__trigger" value="billing">
              Billing
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="primitiv-tabs__panel" value="overview">
            Dashboard summary and recent activity.
          </Tabs.Content>
          <Tabs.Content className="primitiv-tabs__panel" value="settings">
            Profile preferences and notification options.
          </Tabs.Content>
          <Tabs.Content className="primitiv-tabs__panel" value="billing">
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
        <Tabs.Root
          className="primitiv-tabs primitiv-tabs--md"
          defaultValue="first"
          activationMode="manual"
        >
          <Tabs.List
            className="primitiv-tabs__list primitiv-tabs__list--start"
            label="Manual tabs"
          >
            <Tabs.Trigger className="primitiv-tabs__trigger" value="first">
              First
            </Tabs.Trigger>
            <Tabs.Trigger className="primitiv-tabs__trigger" value="second">
              Second
            </Tabs.Trigger>
            <Tabs.Trigger className="primitiv-tabs__trigger" value="third">
              Third
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content className="primitiv-tabs__panel" value="first">
            First panel content.
          </Tabs.Content>
          <Tabs.Content className="primitiv-tabs__panel" value="second">
            Second panel content.
          </Tabs.Content>
          <Tabs.Content className="primitiv-tabs__panel" value="third">
            Third panel content.
          </Tabs.Content>
        </Tabs.Root>
      </section>
    </div>
  );
}
