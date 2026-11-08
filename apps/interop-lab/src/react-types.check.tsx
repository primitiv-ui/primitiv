// Type-level tests for @primitiv-ui/web/react, checked by `pnpm typecheck`.
// Each @ts-expect-error must stay an error; everything else must compile.
import type {} from "@primitiv-ui/web/react";

export const valid = (
  <primitiv-tabs
    value="one"
    orientation="vertical"
    activation-mode="manual"
    onprimitiv-tabs-change={(event) => {
      const next: string = event.detail.value;
      const index: number = event.detail.index;
      event.preventDefault();
      return [next, index];
    }}
  >
    <primitiv-tabs-list label="Sections">
      <primitiv-tabs-trigger value="one" disabled>
        <button type="button">One</button>
      </primitiv-tabs-trigger>
    </primitiv-tabs-list>
    <primitiv-tabs-content value="one" onprimitiv-tabs-show={(event) => event.target}>
      Panel
    </primitiv-tabs-content>
  </primitiv-tabs>
);

// @ts-expect-error — orientation is horizontal | vertical.
export const badOrientation = <primitiv-tabs orientation="diagonal" />;

// @ts-expect-error — activation-mode is automatic | manual.
export const badMode = <primitiv-tabs activation-mode="sometimes" />;

// @ts-expect-error — the change event's detail.value is a string.
export const badDetail = <primitiv-tabs onprimitiv-tabs-change={(event) => event.detail.value.toFixed()} />;

// @ts-expect-error — an unknown primitiv- tag is not an element.
export const unknownTag = <primitiv-tabz />;
