import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Tabs } from '../index.ts';

// StrictMode mounts, unmounts and re-mounts every effect in development. The
// adapter's TabsController must be disconnected on the way out, or two
// controllers would listen and every interaction would be handled twice.
describe('Tabs under StrictMode', () => {
  it('reports each activation exactly once', async () => {
    // Arrange
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StrictMode>
        <Tabs.Root defaultValue="one" onChange={onChange}>
          <Tabs.List label="Sections">
            <Tabs.Trigger value="one">One</Tabs.Trigger>
            <Tabs.Trigger value="two">Two</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="one">First</Tabs.Content>
          <Tabs.Content value="two">Second</Tabs.Content>
        </Tabs.Root>
      </StrictMode>,
    );

    // Act
    await user.click(screen.getByRole('tab', { name: 'Two' }));

    // Assert
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ index: 1, name: 'two' });
  });
});
