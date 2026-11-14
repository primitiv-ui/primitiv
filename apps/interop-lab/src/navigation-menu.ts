// Plain HTML: Navigation Menu markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/navigation-menu";

import { navigationMenuFixtureFromUrl, navigationMenuHtml } from "./navigation-menu-fixture";

const fixture = navigationMenuFixtureFromUrl();
(document.getElementById("app") as HTMLElement).innerHTML =
  `<div${fixture.rtl ? ' dir="rtl"' : ""}>${navigationMenuHtml(fixture)}</div>` +
  `<button type="button" id="outside">Outside</button>`;
