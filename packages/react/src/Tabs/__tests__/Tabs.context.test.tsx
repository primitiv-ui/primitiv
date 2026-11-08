import { render, screen } from '@testing-library/react';

import { Tabs, useTabsContext } from '../index.ts';

// `useTabsContext` is public, so its shape is API. Since the adapter move (RFC
// 0033 §3.4) Tabs' own triggers no longer call `focusTrigger` — the
// TabsController moves focus — but a consumer's custom part still can, and it
// must keep working.
function FocusTwo() {
  const { focusTrigger } = useTabsContext();
  return (
    <button type="button" onClick={() => focusTrigger('two')}>
      Focus two
    </button>
  );
}

describe('Tabs context', () => {
  it("lets a custom part move focus to a trigger through focusTrigger", () => {
    // Arrange
    render(
      <Tabs.Root defaultValue="one">
        <Tabs.List label="Sections">
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
        <FocusTwo />
      </Tabs.Root>,
    );

    // Act
    screen.getByRole('button', { name: 'Focus two' }).click();

    // Assert
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveFocus();
  });

  it('reports which triggers are disabled, following changes', () => {
    // Arrange
    const seen: string[][] = [];
    function Spy() {
      seen.push([...useTabsContext().disabledTriggerValues]);
      return null;
    }
    const tabs = (twoDisabled: boolean) => (
      <Tabs.Root defaultValue="one">
        <Tabs.List label="Sections">
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two" disabled={twoDisabled}>
            Two
          </Tabs.Trigger>
        </Tabs.List>
        <Spy />
      </Tabs.Root>
    );
    const { rerender } = render(tabs(false));

    // Act
    rerender(tabs(true));

    // Assert
    expect(seen.at(-1)).toEqual(['two']);
    expect(seen).toContainEqual([]);
  });
});
