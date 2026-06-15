import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';

import { Tabs } from '../index.ts';

describe('Tabs controlled state tests', () => {
  it('should respect the value prop for active tab', () => {
    // Arrange
    render(
      <Tabs.Root value="tab2" onValueChange={vi.fn()}>
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
        <Tabs.Content value="tab3">Content 3</Tabs.Content>
      </Tabs.Root>,
    );

    // Assert
    const tab1Trigger = screen.getByRole('tab', { name: 'Tab 1' });
    const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
    const tab3Trigger = screen.getByRole('tab', { name: 'Tab 3' });

    const hiddenPanels = screen.queryAllByRole('tabpanel', { hidden: true });
    const tab1Panel = hiddenPanels[0];
    const tab2Panel = screen.getByRole('tabpanel', { name: 'Tab 2' });
    const tab3Panel = hiddenPanels[2];

    expect(tab1Trigger).toHaveAttribute('aria-selected', 'false');
    expect(tab1Trigger).toHaveAttribute('data-state', 'inactive');
    expect(tab1Trigger).toHaveAttribute('tabindex', '-1');

    expect(tab2Trigger).toHaveAttribute('aria-selected', 'true');
    expect(tab2Trigger).toHaveAttribute('data-state', 'active');
    expect(tab2Trigger).toHaveAttribute('tabindex', '0');

    expect(tab3Trigger).toHaveAttribute('aria-selected', 'false');
    expect(tab3Trigger).toHaveAttribute('data-state', 'inactive');
    expect(tab3Trigger).toHaveAttribute('tabindex', '-1');

    expect(tab1Panel).toHaveAttribute('data-state', 'inactive');
    expect(tab1Panel).toHaveAttribute('tabindex', '-1');
    expect(tab1Panel).toHaveAttribute('hidden');

    expect(tab2Panel).toHaveAttribute('data-state', 'active');
    expect(tab2Panel).toHaveAttribute('tabindex', '0');
    expect(tab2Panel).not.toHaveAttribute('hidden');

    expect(tab3Panel).toHaveAttribute('data-state', 'inactive');
    expect(tab3Panel).toHaveAttribute('tabindex', '-1');
    expect(tab3Panel).toHaveAttribute('hidden');
  });

  it('should not change state internally when in controlled mode', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Tabs.Root value="tab1" onValueChange={handleValueChange}>
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
        <Tabs.Content value="tab3">Content 3</Tabs.Content>
      </Tabs.Root>,
    );

    // Act
    const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
    await user.click(tab2Trigger);

    // Assert
    expect(handleValueChange).toHaveBeenCalledWith('tab2');
    const tab1Trigger = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1Trigger).toHaveAttribute('aria-selected', 'true');
    expect(tab2Trigger).toHaveAttribute('aria-selected', 'false');
  });

  it('should not change state internally when in controlled mode', async () => {
    // Arrange
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Tabs.Root value="tab1" onValueChange={handleValueChange}>
        <Tabs.List label="Test tabs">
          <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
          <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="tab1">Content 1</Tabs.Content>
        <Tabs.Content value="tab2">Content 2</Tabs.Content>
        <Tabs.Content value="tab3">Content 3</Tabs.Content>
      </Tabs.Root>,
    );

    // Act
    const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
    await user.click(tab2Trigger);

    // Assert
    expect(handleValueChange).toHaveBeenCalledWith('tab2');
    const tab1Trigger = screen.getByRole('tab', { name: 'Tab 1' });
    expect(tab1Trigger).toHaveAttribute('aria-selected', 'true');
    expect(tab2Trigger).toHaveAttribute('aria-selected', 'false');
  });

  it('should update active tab when parent updates value prop', async () => {
    // Arrange
    const user = userEvent.setup();

    function ControlledTabsParent() {
      const [activeTab, setActiveTab] = useState('tab1');

      return (
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
            <Tabs.Trigger value="tab3">Tab 3</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
          <Tabs.Content value="tab3">Content 3</Tabs.Content>
        </Tabs.Root>
      );
    }

    render(<ControlledTabsParent />);

    // Assert initial state
    const tab1Trigger = screen.getByRole('tab', { name: 'Tab 1' });
    const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
    expect(tab1Trigger).toHaveAttribute('aria-selected', 'true');
    expect(tab2Trigger).toHaveAttribute('aria-selected', 'false');

    // Act - user clicks tab2, parent updates state
    await user.click(tab2Trigger);

    // Assert - component updated to match new value from parent
    expect(tab1Trigger).toHaveAttribute('aria-selected', 'false');
    expect(tab2Trigger).toHaveAttribute('aria-selected', 'true');
  });
});
