import { Collapsible, Checkbox } from "@primitiv/react";

import "./CollapsibleExample.scss";

export function CollapsibleExample() {
  return (
    <div className="collapsible-example">
      <h2 className="collapsible-example__title">Collapsible</h2>

      <Collapsible.Root className="collapsible" defaultOpen={false}>
        <Collapsible.Trigger className="collapsible__trigger">
          Advanced Settings
          <Collapsible.TriggerIcon className="collapsible__trigger-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Collapsible.TriggerIcon>
        </Collapsible.Trigger>
        <Collapsible.Content className="collapsible__content">
          <div className="collapsible__settings">
            <label className="collapsible__field">
              <span>Light Padding</span>
              <input type="range" min="0" max="20" defaultValue="10" />
            </label>
            <label className="collapsible__field">
              <span>Dark Padding</span>
              <input type="range" min="0" max="20" defaultValue="10" />
            </label>
            <label htmlFor="include-greyscale" className="collapsible__field">
              <span>Include greyscale</span>
              <Checkbox.Root
                aria-label="Include greyscale"
                id="include-greyscale"
                className="checkbox"
              >
                <Checkbox.Indicator className="checkbox__indicator" forceMount>
                  ✓
                </Checkbox.Indicator>
              </Checkbox.Root>
            </label>
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
