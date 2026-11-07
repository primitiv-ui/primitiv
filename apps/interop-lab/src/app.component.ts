// Angular rendering the raw elements, compiled ahead of time: CUSTOM_ELEMENTS_SCHEMA
// lets the primitiv- tags through, `[value]` sets the element's property,
// `[attr.…]` writes the attributes it has no property for, `(primitiv-tabs-change)`
// listens to the kebab-case event, and controlled use goes through preventDefault.
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";

import { fixtureFromUrl, TABS } from "./fixture";

@Component({
  selector: "lab-app",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [attr.dir]="fixture.dir">
      <primitiv-tabs
        [value]="value()"
        [attr.orientation]="fixture.orientation"
        [attr.activation-mode]="fixture.mode"
        (primitiv-tabs-change)="onChange($event)"
      >
        <primitiv-tabs-list label="Sections">
          @for (tab of tabs; track tab.value) {
            <primitiv-tabs-trigger [attr.value]="tab.value" [attr.disabled]="fixture.disabled.includes(tab.value) ? '' : null">
              <button type="button">{{ tab.label }}</button>
            </primitiv-tabs-trigger>
          }
        </primitiv-tabs-list>
        @for (tab of tabs; track tab.value) {
          <primitiv-tabs-content [attr.value]="tab.value">{{ tab.panel }}</primitiv-tabs-content>
        }
      </primitiv-tabs>
      <output data-testid="state">{{ value() }}</output>
      <button type="button" data-testid="rerender" (click)="renders.set(renders() + 1)">Re-render {{ renders() }}</button>
    </div>
  `,
})
export class AppComponent {
  protected readonly fixture = fixtureFromUrl();
  protected readonly tabs = TABS;
  protected readonly value = signal(this.fixture.value ?? "one");
  protected readonly renders = signal(0);

  protected onChange(event: Event) {
    const { detail } = event as CustomEvent<{ value: string }>;
    event.preventDefault();
    this.value.set(detail.value);
  }
}
