// The markup `primitiv add tabs` printed, pasted into the page as a consumer
// would, then the elements defined over it (the lab's stand-in for the CDN
// script, so it runs from workspace source).
import markup from "../styled-site/tabs.example.html?raw";

(document.getElementById("app") as HTMLElement).innerHTML = markup;
await import("@primitiv-ui/web/define");
