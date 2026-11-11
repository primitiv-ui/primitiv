// Plain HTML: ToggleGroup markup a server could have sent, plus one import.
import "@primitiv-ui/web/define/toggle-group";

import { toggleGroupFixtureFromUrl, toggleGroupHtml } from "./toggle-group-fixture";

const fixture = toggleGroupFixtureFromUrl();
const app = document.getElementById("app") as HTMLElement;
if (fixture.dir) app.dir = fixture.dir;
app.innerHTML = toggleGroupHtml(fixture);
