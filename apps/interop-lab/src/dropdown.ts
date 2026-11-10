// Plain HTML: Dropdown markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/dropdown";

import { dropdownFixtureFromUrl, dropdownHtml } from "./dropdown-fixture";

(document.getElementById("app") as HTMLElement).innerHTML =
  dropdownHtml(dropdownFixtureFromUrl()) + `<button type="button" id="outside">Outside</button>`;
