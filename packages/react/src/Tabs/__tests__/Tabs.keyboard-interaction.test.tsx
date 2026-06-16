import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from '../index.ts';

import { arrowKeyCases } from './Tabs.fixtures';

describe('Tabs keyboard navigation', () => {
  describe('Tab key focus management', () => {
    it('should focus the active tab when tabbing into the component', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab2">
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
      await user.tab();

      // Assert
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      expect(tab2).toHaveFocus();
    });

  });

  describe('Arrow key navigation', () => {
    it.each(arrowKeyCases)(
      '$description',
      async ({ dir, orientation, defaultValue, key, expectedTab, expectedDeselected }) => {
        // Arrange
        const user = userEvent.setup();
        render(
          <Tabs.Root dir={dir} orientation={orientation} defaultValue={defaultValue}>
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
        await user.tab();
        await user.keyboard(key);

        // Assert
        const expectedTabEl = screen.getByRole('tab', { name: expectedTab });
        expect(expectedTabEl).toHaveFocus();
        expect(expectedTabEl).toHaveAttribute('aria-selected', 'true');
        for (const deselected of expectedDeselected) {
          const deselectedTabEl = screen.getByRole('tab', { name: deselected });
          expect(deselectedTabEl).toHaveAttribute('aria-selected', 'false');
        }
      },
    );
  });

  describe('Home and End key navigation', () => {
    it('should move focus to and activate first tab when Home key is pressed', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab2">
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
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });

      // Act
      await user.tab();
      await user.keyboard('{Home}');

      // Assert
      expect(tab1).toHaveFocus();
      expect(tab1).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });

    it('should move focus to and activate last tab when End key is pressed', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root defaultValue="tab2">
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
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });

      // Act
      await user.tab();
      await user.keyboard('{End}');

      // Assert
      expect(tab3).toHaveFocus();
      expect(tab3).toHaveAttribute('aria-selected', 'true');
      expect(tab2).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Disabled keyboard events', () => {
    it('should ignore Up/Down arrow key events in horizontal mode', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root dir="ltr" defaultValue="tab2">
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
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });

      // Act
      await user.tab();
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{ArrowDown}');

      // Assert
      expect(tab2).toHaveFocus();
      expect(tab2).toHaveAttribute('aria-selected', 'true');
      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('aria-selected', 'false');
    });

    it('should ignore Left/Right arrow key events in vertical mode', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <Tabs.Root dir="ltr" orientation="vertical" defaultValue="tab2">
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
      const tab2 = screen.getByRole('tab', { name: 'Tab 2' });
      const tab1 = screen.getByRole('tab', { name: 'Tab 1' });
      const tab3 = screen.getByRole('tab', { name: 'Tab 3' });

      // Act
      await user.tab();
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowRight}');

      // Assert
      expect(tab2).toHaveFocus();
      expect(tab2).toHaveAttribute('aria-selected', 'true');
      expect(tab1).toHaveAttribute('aria-selected', 'false');
      expect(tab3).toHaveAttribute('aria-selected', 'false');
    });
  });
});
