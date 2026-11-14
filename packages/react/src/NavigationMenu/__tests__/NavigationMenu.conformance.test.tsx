import { NAVIGATION_MENU, runNavigationMenuConformance } from "@primitiv-ui/conformance";
import { act, render } from "@testing-library/react";

import { NavigationMenu } from "..";

// The React reference surface runs the shared NavigationMenu suite (RFC 0033
// §6.2). It is expected to pass here first: React is the implementation the
// suite describes, so a failure is a real React bug, fixed in its own cycle.
runNavigationMenuConformance(
  async ({ value, orientation, rtl, openOnHover, delay = 0, closeDelay = 0, viewport, indicator, active }) => {
    let unmount = () => {};
    await act(async () => {
      ({ unmount } = render(
        <div dir={rtl ? "rtl" : undefined}>
          <NavigationMenu.Root
            defaultValue={value}
            orientation={orientation}
            dir={rtl ? "rtl" : undefined}
            openOnHover={openOnHover}
            delayDuration={delay}
            closeDelay={closeDelay}
          >
            <NavigationMenu.List>
              {NAVIGATION_MENU.entries.map((entry) => (
                <NavigationMenu.Item key={entry.value} value={entry.value}>
                  <NavigationMenu.Trigger>{entry.label}</NavigationMenu.Trigger>
                  <NavigationMenu.Content>
                    {entry.links.map((label) => (
                      <NavigationMenu.Link key={label} href={`#${label}`}>
                        {label}
                      </NavigationMenu.Link>
                    ))}
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              ))}
              <NavigationMenu.Item>
                <NavigationMenu.Link href="#pricing" active={active}>
                  {NAVIGATION_MENU.link}
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            </NavigationMenu.List>
            {indicator && <NavigationMenu.Indicator data-testid="indicator" />}
            {viewport && <NavigationMenu.Viewport data-testid="viewport" />}
          </NavigationMenu.Root>
          <button type="button">{NAVIGATION_MENU.outside}</button>
        </div>,
      ));
    });
    return {
      cleanup: () => unmount(),
      wait: (ms) => act(() => new Promise((resolve) => setTimeout(resolve, ms))),
    };
  },
);
