---
description: Warm up a Figma session — check the Desktop Bridge connection, load the wireframe tokens skill, and refresh component node IDs for Button and Icon so they are ready to use.
---

You are starting a Figma working session for this project. Run the following steps in order.

## Steps

1. **Check the connection** using `figma_get_status` with `probe: true`.
   - If the probe fails, stop and tell the user: the Figma Desktop app must be open with the Console Bridge plugin running. Do not continue.
   - If connected, note the file name and current page from the response.

2. **Load the `figma-wireframe-tokens` skill** (Skill tool) so token values, font mappings, and the Inter remap script are in context.

3. **Refresh component node IDs** by calling `figma_search_components` twice in parallel:
   - query `"Button"` — note the nodeId for the `Button` component set.
   - query `"Icon"` — note the nodeId for the `Icon` component set.

4. **Report back** in a short summary:
   - Connected file and page
   - Button component set nodeId
   - Icon component set nodeId (and how many variants)
   - Confirmation that the wireframe tokens skill is loaded

Keep the summary to 4–5 lines. The user is ready to give a design task immediately after.
