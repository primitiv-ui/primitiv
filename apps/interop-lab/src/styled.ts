// The markup `primitiv add tabs` and `add accordion` printed, pasted into the page as a consumer
// would, then the elements defined over it (the lab's stand-in for the CDN
// script, so it runs from workspace source).
import accordion from "../styled-site/accordion.example.html?raw";
import tabs from "../styled-site/tabs.example.html?raw";

(document.getElementById("app") as HTMLElement).innerHTML = tabs + accordion;
await import("@primitiv-ui/web/define");
