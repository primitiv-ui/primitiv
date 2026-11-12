// Plain HTML: Listbox markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/listbox";

import { listboxFixtureFromUrl, listboxHtml } from "./listbox-fixture";

const fixture = listboxFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = `${listboxHtml(fixture)}<button type="button" id="after">After</button>`;
