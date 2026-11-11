// Plain HTML: Context Menu markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/context-menu";

import { contextMenuFixtureFromUrl, contextMenuHtml } from "./context-menu-fixture";

(document.getElementById("app") as HTMLElement).innerHTML =
  contextMenuHtml(contextMenuFixtureFromUrl()) + `<button type="button" id="outside">Outside</button>`;
