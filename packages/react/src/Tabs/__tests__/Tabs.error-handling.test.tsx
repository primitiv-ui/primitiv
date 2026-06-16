import { render, screen } from '@testing-library/react';
import { act, useState } from 'react';

import { Tabs } from '../index.ts';

import { errorCases } from './Tabs.fixtures';

describe('Error Handling', () => {
  it.each(errorCases)('should throw error when $name is not a valid tab', ({ rootProps }) => {
    // Arrange & Assert
    const exampleIncorrectValue = rootProps.value || rootProps.defaultValue;
    expect(() =>
      render(
        <Tabs.Root {...rootProps}>
          <Tabs.List label="Test label">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Panel 1</Tabs.Content>
          <Tabs.Content value="tab2">Panel 2</Tabs.Content>
        </Tabs.Root>,
      ),
    ).toThrow(
      `Invalid active tab value: "${exampleIncorrectValue}". Valid values are: [tab1, tab2]`,
    );
  });

  it('should throw when the controlled active tab is removed dynamically', () => {
    // Arrange
    function DynamicTabs({ showTab2 }: { showTab2: boolean }) {
      return (
        <Tabs.Root value="tab2" onValueChange={() => {}}>
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            {showTab2 && <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>}
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          {showTab2 && <Tabs.Content value="tab2">Content 2</Tabs.Content>}
        </Tabs.Root>
      );
    }
    const { rerender } = render(<DynamicTabs showTab2={true} />);

    // Act & Assert — removing tab2 while it is the active value must throw
    expect(() => {
      rerender(<DynamicTabs showTab2={false} />);
    }).toThrow('Invalid active tab value: "tab2"');
  });

  it('should throw error when value prop changes to an invalid tab (controlled mode only)', () => {
    // Arrange
    const exampleIncorrectValue = 'nonexistent';
    function ControlledTabs() {
      const [tab, setTab] = useState('tab1');
      return (
        <>
          <button type="button" onClick={() => setTab(exampleIncorrectValue)}>
            Set Invalid Tab
          </button>
          <Tabs.Root value={tab} onValueChange={setTab}>
            <Tabs.List label="Test label">
              <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1">Panel 1</Tabs.Content>
            <Tabs.Content value="tab2">Panel 2</Tabs.Content>
          </Tabs.Root>
        </>
      );
    }
    render(<ControlledTabs />);

    // Act & Assert
    expect(() => {
      act(() => {
        screen.getByText('Set Invalid Tab').click();
      });
    }).toThrow(
      `Invalid active tab value: "${exampleIncorrectValue}". Valid values are: [tab1, tab2]`,
    );
  });
});
