import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Popover } from "../Popover";

// The panel's DOM behaviour runs in the shared PopoverController from
// @primitiv-ui/web (RFC 0033 §3.4). This covers what hosting it adds: the
// controller stops listening when the component unmounts.

describe("Popover on the shared controller", () => {
  it("stops listening for outside presses once unmounted", async () => {
    // Arrange
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { unmount } = render(
      <Popover.Root open onOpenChange={onOpenChange}>
        <Popover.Trigger>Open</Popover.Trigger>
        <Popover.Content>Panel</Popover.Content>
      </Popover.Root>,
    );
    const outside = document.body.appendChild(document.createElement("button"));

    // Act
    unmount();
    await user.click(outside);

    // Assert
    expect(onOpenChange).not.toHaveBeenCalled();
    outside.remove();
  });
});
