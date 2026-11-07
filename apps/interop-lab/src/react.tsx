// React 19 rendering the raw elements (not @primitiv-ui/react): property and
// attribute binding, the raw kebab-case event, and controlled use through
// preventDefault (RFC 0033 §5.6.3, D7).
import "@primitiv-ui/web/define";
import type {} from "@primitiv-ui/web/react";

import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";

import { fixtureFromUrl, TABS } from "./fixture";

const fixture = fixtureFromUrl();

function App() {
  const [value, setValue] = useState(fixture.value ?? "one");
  const [renders, setRenders] = useState(0);
  return (
    <div dir={fixture.dir ?? undefined}>
      <primitiv-tabs
        value={value}
        orientation={(fixture.orientation ?? undefined) as "horizontal" | "vertical" | undefined}
        activation-mode={(fixture.mode ?? undefined) as "automatic" | "manual" | undefined}
        onprimitiv-tabs-change={(event: CustomEvent<{ value: string }>) => {
          // Controlled: veto the element's own change and apply React's.
          event.preventDefault();
          setValue(event.detail.value);
        }}
      >
        <primitiv-tabs-list label="Sections">
          {TABS.map((tab) => (
            <primitiv-tabs-trigger key={tab.value} value={tab.value} disabled={fixture.disabled.includes(tab.value) || undefined}>
              <button type="button">{tab.label}</button>
            </primitiv-tabs-trigger>
          ))}
        </primitiv-tabs-list>
        {TABS.map((tab) => (
          <primitiv-tabs-content key={tab.value} value={tab.value}>
            {tab.panel}
          </primitiv-tabs-content>
        ))}
      </primitiv-tabs>
      <output data-testid="state">{value}</output>
      <button type="button" data-testid="rerender" onClick={() => setRenders((n) => n + 1)}>
        Re-render {renders}
      </button>
    </div>
  );
}

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
