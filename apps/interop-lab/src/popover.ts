// Plain HTML: Popover markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/popover";

import { popoverFixtureFromUrl, popoverHtml } from "./popover-fixture";

(document.getElementById("app") as HTMLElement).innerHTML =
  popoverHtml(popoverFixtureFromUrl()) + `<button type="button" id="outside">Outside</button>`;
