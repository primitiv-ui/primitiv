// Plain HTML: Combobox markup a server could have sent, plus one import and the
// page's own filter, inside a real form that reports what it would submit.
import "@primitiv-ui/web/define/combobox";

import { comboboxFixtureFromUrl, comboboxHtml, filterOnQuery } from "./combobox-fixture";

const fixture = comboboxFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
app.innerHTML =
  `<form id="form"><button type="button" id="before">Before</button>${comboboxHtml(fixture)}` +
  `<button type="submit" id="submit">Submit</button></form><output id="submitted"></output>`;
filterOnQuery(document.getElementById("combobox") as HTMLElement);
document.getElementById("form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  (document.getElementById("submitted") as HTMLElement).textContent = JSON.stringify([...data.entries()]);
});
