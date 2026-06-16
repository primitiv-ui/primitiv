import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from '../index.ts';

describe('Tabs mouse interaction tests', () => {
  describe('tab and panel activation', () => {
    it('should activate a tab when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab1">
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
      expect(tab2Trigger).toHaveAttribute('aria-selected', 'true');
      expect(tab2Trigger).toHaveAttribute('data-state', 'active');
      expect(tab2Trigger).toHaveAttribute('tabindex', '0');
      expect(tab2Trigger).toHaveFocus();
    });

    it('should deactivate non-active tabs when activating another', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab1">
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
      const tab1Trigger = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
      const tab3Trigger = screen.getByRole('tab', { name: 'Tab 3' });
      await user.click(tab2Trigger);

      // Assert
      expect(tab1Trigger).toHaveAttribute('aria-selected', 'false');
      expect(tab1Trigger).toHaveAttribute('data-state', 'inactive');
      expect(tab1Trigger).toHaveAttribute('tabindex', '-1');

      expect(tab3Trigger).toHaveAttribute('aria-selected', 'false');
      expect(tab3Trigger).toHaveAttribute('data-state', 'inactive');
      expect(tab3Trigger).toHaveAttribute('tabindex', '-1');
    });

    it('should activate a content panel when clicked', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab1">
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
      const tab2Panel = screen.getByRole('tabpanel', { name: 'Tab 2' });
      expect(tab2Panel).toHaveAttribute('data-state', 'active');
      expect(tab2Panel).toHaveAttribute('tabindex', '0');
      expect(tab2Panel).not.toHaveAttribute('hidden');
    });

    it('should deactivate non-active content panels when activating another', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab1">
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
      const panels = screen.queryAllByRole('tabpanel', { hidden: true });
      const tab1Panel = panels[0];
      const tab3Panel = panels[2];

      expect(tab1Panel).toHaveAttribute('data-state', 'inactive');
      expect(tab1Panel).toHaveAttribute('tabindex', '-1');
      expect(tab1Panel).toHaveAttribute('hidden');

      expect(tab3Panel).toHaveAttribute('data-state', 'inactive');
      expect(tab3Panel).toHaveAttribute('tabindex', '-1');
      expect(tab3Panel).toHaveAttribute('hidden');
    });
  });

  describe('click handlers', () => {
    it('should call custom onClick handler when provided', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2" onClick={handleClick}>
              Tab 2
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );

      // Act
      const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2Trigger);

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should call custom onClick handler AND activate the tab', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2" onClick={handleClick}>
              Tab 2
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );

      // Act
      const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2Trigger);

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(tab2Trigger).toHaveAttribute('aria-selected', 'true');
      expect(tab2Trigger).toHaveAttribute('data-state', 'active');
      expect(tab2Trigger).toHaveAttribute('tabindex', '0');
    });

    it('should receive the click event in custom onClick handler', async () => {
      // Arrange
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Tabs.Root defaultValue="tab1">
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2" onClick={handleClick}>
              Tab 2
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );

      // Act
      const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2Trigger);

      // Assert
      expect(handleClick).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'click',
          target: tab2Trigger,
        }),
      );
    });
  });
});
