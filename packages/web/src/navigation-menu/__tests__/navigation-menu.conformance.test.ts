import { runNavigationMenuConformance } from "@primitiv-ui/conformance";

import { defineNavigationMenu } from "../elements";
import { navigationMenuHtml } from "./navigation-menu.fixtures";

runNavigationMenuConformance(async (fixture) => {
  defineNavigationMenu();
  document.body.innerHTML = navigationMenuHtml({ delay: 0, closeDelay: 0, ...fixture });
  await Promise.resolve();
  return {
    cleanup: () => document.body.replaceChildren(),
    wait: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  };
});
