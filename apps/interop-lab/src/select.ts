// Plain HTML: Select markup a server could have sent, plus one import, inside a
// real form that reports what it would submit.
import "@primitiv-ui/web/define/select";

import { selectFixtureFromUrl, selectHtml } from "./select-fixture";

const fixture = selectFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
app.innerHTML =
  `<form id="form"><button type="button" id="before">Before</button>${selectHtml(fixture)}` +
  `<button type="submit" id="submit">Submit</button></form><output id="submitted"></output>`;
document.getElementById("form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(event.target as HTMLFormElement);
  (document.getElementById("submitted") as HTMLElement).textContent = JSON.stringify([...data.entries()]);
});
