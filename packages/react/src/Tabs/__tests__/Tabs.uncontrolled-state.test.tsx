import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from '../index.ts';

describe('Tabs state tests', () => {
  describe('no defaultValue provided', () => {
    it('should set tabindex=0 on the first trigger so the tablist is keyboard-reachable', () => {
      render(
        <Tabs.Root>
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );

      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('tab', { name: 'Tab 2' })).toHaveAttribute('tabindex', '-1');
    });

    it('should focus the first trigger when tabbing into the component with no defaultValue', async () => {
      const user = userEvent.setup();
      render(
        <Tabs.Root>
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );

      await user.tab();
      expect(screen.getByRole('tab', { name: 'Tab 1' })).toHaveFocus();
    });
  });
  describe('default active state', () => {
    describe('default active state - Tabs.Trigger', () => {
      it.each([
        { attribute: 'aria-selected', value: 'true' },
        { attribute: 'data-state', value: 'active' },
        { attribute: 'tabindex', value: '0' },
      ])('should set $attribute to $value on the first tab by default', ({ attribute, value }) => {
        // Arrange
        render(
          <Tabs.Root defaultValue="tab1">
            <Tabs.List label="Test tabs">
              <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
              <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="tab1">Content 1</Tabs.Content>
            <Tabs.Content value="tab2">Content 2</Tabs.Content>
          </Tabs.Root>,
        );

        const firstTab = screen.getByRole('tab', { name: 'Tab 1' });

        // Assert
        expect(firstTab).toHaveAttribute(attribute, value);
      });

      it.each([
        { attribute: 'aria-selected', value: 'false' },
        { attribute: 'data-state', value: 'inactive' },
        { attribute: 'tabindex', value: '-1' },
      ])(
        'should set $attribute to $value on the non-active tabs by default',
        ({ attribute, value }) => {
          // Arrange
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

          const secondTab = screen.getByRole('tab', { name: 'Tab 2' });
          const thirdTab = screen.getByRole('tab', { name: 'Tab 3' });

          // Assert
          expect(secondTab).toHaveAttribute(attribute, value);
          expect(thirdTab).toHaveAttribute(attribute, value);
        },
      );
    });

    describe('default active state - Tabs.Content', () => {
      it.each([
        { attribute: 'data-state', value: 'active' },
        { attribute: 'tabindex', value: '0' },
      ])(
        'should set $attribute to $value on the first content panel by default',
        ({ attribute, value }) => {
          // Arrange
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

          const firstTabPanel = screen.getByRole('tabpanel', { name: 'Tab 1' });

          // Assert
          expect(firstTabPanel).toHaveAttribute(attribute, value);
        },
      );

      it('should not set hidden attribute on the first content panel by default', () => {
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

        const firstTabPanel = screen.getByRole('tabpanel', { name: 'Tab 1' });

        expect(firstTabPanel).not.toHaveAttribute('hidden');
      });

      it.each([
        { attribute: 'data-state', value: 'inactive' },
        { attribute: 'tabindex', value: '-1' },
      ])(
        'should set $attribute to $value on the non-active content panels by default',
        ({ attribute, value }) => {
          // Arrange
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

          const panels = screen.queryAllByRole('tabpanel', { hidden: true });
          const secondTabPanel = panels[1];
          const thirdTabPanel = panels[2];

          // Assert
          expect(secondTabPanel).toHaveAttribute(attribute, value);
          expect(thirdTabPanel).toHaveAttribute(attribute, value);
        },
      );

      it('should set hidden attribute on the non-active content panels by default', () => {
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

        const panels = screen.queryAllByRole('tabpanel', { hidden: true });
        const secondTabPanel = panels[1];
        const thirdTabPanel = panels[2];

        expect(secondTabPanel).toHaveAttribute('hidden');
        expect(thirdTabPanel).toHaveAttribute('hidden');
      });
    });
  });
});
