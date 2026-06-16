import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from '../index.ts';

import { mouseChangeEventCases, keyboardChangeEventCases } from './Tabs.fixtures';

describe('Tabs change event callbacks', () => {
  describe('optional onChange callback', () => {
    it.each(mouseChangeEventCases)(
      'should call onChange with value and index when tab is activated via $name',
      async ({ interact, getTab, expected }) => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
          <Tabs.Root defaultValue="tab1" onChange={handleChange}>
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

        const tab2 = getTab();
        await interact(tab2, user);

        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(expected);
      },
    );

    it.each(keyboardChangeEventCases)(
      'should call onChange with value and index when tab is activated via $name',
      async ({ interact, getTab, expected, defaultValue }) => {
        const user = userEvent.setup();
        const handleChange = vi.fn();

        render(
          <Tabs.Root defaultValue={defaultValue} onChange={handleChange}>
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

        await interact(user);
        const tab = getTab();
        expect(tab).toHaveFocus();
        expect(handleChange).toHaveBeenCalledTimes(1);
        expect(handleChange).toHaveBeenCalledWith(expected);
      },
    );

    it('should call onChange in controlled mode', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      const handleValueChange = vi.fn();

      render(
        <Tabs.Root value="tab1" onValueChange={handleValueChange} onChange={handleChange}>
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

      const tab2Trigger = screen.getByRole('tab', { name: 'Tab 2' });
      await user.click(tab2Trigger);

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith({ index: 1, name: 'tab2' });
      expect(handleValueChange).toHaveBeenCalledWith('tab2');
    });

    it('should not call onChange if clicking already active tab', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Tabs.Root defaultValue="tab1" onChange={handleChange}>
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

      const tab1Trigger = screen.getByRole('tab', { name: 'Tab 1' });
      await user.click(tab1Trigger);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not call onValueChange if clicking already active tab in controlled mode', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();

      render(
        <Tabs.Root value="tab1" onValueChange={handleValueChange}>
          <Tabs.List label="Test tabs">
            <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
            <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="tab1">Content 1</Tabs.Content>
          <Tabs.Content value="tab2">Content 2</Tabs.Content>
        </Tabs.Root>,
      );

      await user.click(screen.getByRole('tab', { name: 'Tab 1' }));

      expect(handleValueChange).not.toHaveBeenCalled();
    });
  });
});
