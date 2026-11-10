// Plain HTML: Modal markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/modal";

import { modalFixtureFromUrl, modalHtml } from "./modal-fixture";

(document.getElementById("app") as HTMLElement).innerHTML =
  `<button type="button" id="outside">Outside</button>` +
  modalHtml(modalFixtureFromUrl(), "modal", {
    inner: `<form method="dialog"><button type="submit" id="submit">Save</button></form>`,
  });
