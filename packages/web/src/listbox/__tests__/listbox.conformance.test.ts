import { runListboxConformance } from "@primitiv-ui/conformance";

import { defineListbox } from "../elements";
import { listboxHtml } from "./listbox.fixtures";

runListboxConformance(
  async ({ type, value = [], orientation, dir, selectionFollowsFocus, disabled, grouped, label }) => {
    defineListbox();
    const listbox = listboxHtml({
      type,
      value: value.join(" "),
      orientation,
      followFocus: selectionFollowsFocus,
      disabled,
      grouped,
      label,
    });
    const markup = `${listbox}<button type="button">After</button>`;
    document.body.innerHTML = dir ? `<div dir="${dir}">${markup}</div>` : markup;
    await Promise.resolve();
    return () => document.body.replaceChildren();
  },
);
