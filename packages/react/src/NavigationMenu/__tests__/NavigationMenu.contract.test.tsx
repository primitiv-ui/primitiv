import { NavigationMenu } from "../NavigationMenu";
import {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../NavigationMenu";

describe("NavigationMenu — public contract", () => {
  it("exposes every sub-component on the compound", () => {
    expect(NavigationMenu.Root).toBe(NavigationMenu);
    expect(NavigationMenu.List).toBe(NavigationMenuList);
    expect(NavigationMenu.Item).toBe(NavigationMenuItem);
    expect(NavigationMenu.Trigger).toBe(NavigationMenuTrigger);
    expect(NavigationMenu.Content).toBe(NavigationMenuContent);
    expect(NavigationMenu.Viewport).toBe(NavigationMenuViewport);
    expect(NavigationMenu.Indicator).toBe(NavigationMenuIndicator);
    expect(NavigationMenu.Link).toBe(NavigationMenuLink);
  });

  it("names the compound and each sub-component for React DevTools", () => {
    expect(NavigationMenu.displayName).toBe("NavigationMenu");
    expect(NavigationMenuList.displayName).toBe("NavigationMenuList");
    expect(NavigationMenuItem.displayName).toBe("NavigationMenuItem");
    expect(NavigationMenuTrigger.displayName).toBe("NavigationMenuTrigger");
    expect(NavigationMenuContent.displayName).toBe("NavigationMenuContent");
    expect(NavigationMenuViewport.displayName).toBe("NavigationMenuViewport");
    expect(NavigationMenuIndicator.displayName).toBe("NavigationMenuIndicator");
    expect(NavigationMenuLink.displayName).toBe("NavigationMenuLink");
  });
});
