# Auto-layout for token-driven dimensions

`node.width` and `node.height` can only be bound to FLOAT variables when the
node has `layoutSizingHorizontal/Vertical = "FIXED"`, which in turn requires
`layoutMode ≠ NONE`. Without auto-layout you cannot bind dimensions to tokens
at all — component geometry stays hardcoded and clone-and-rebind won't resize
across densities.

For a pill/track component (e.g. Switch) where layout drives thumb position:

```js
comp.layoutMode = "HORIZONTAL";
comp.layoutSizingHorizontal = "FIXED";
comp.layoutSizingVertical   = "FIXED";
comp.counterAxisAlignItems  = "CENTER";      // centres thumb vertically
// Unchecked: thumb at left
comp.primaryAxisAlignItems  = "MIN";
comp.setBoundVariable('paddingLeft',  thumbMarginVar);
// Checked: thumb at right
comp.primaryAxisAlignItems  = "MAX";
comp.setBoundVariable('paddingRight', thumbMarginVar);
// Bind dimensions
comp.setBoundVariable('width',  trackWidthVar);
comp.setBoundVariable('height', trackHeightVar);
// Ring frames must be ABSOLUTE so layout doesn't reposition them
ringGapFr.layoutPositioning  = "ABSOLUTE";
ringFr.layoutPositioning     = "ABSOLUTE";
// Thumb stays in flow with FIXED sizing
thumb.layoutSizingHorizontal = "FIXED";
thumb.layoutSizingVertical   = "FIXED";
thumb.setBoundVariable('width',  thumbSizeVar);
thumb.setBoundVariable('height', thumbSizeVar);
```

`paddingLeft` / `paddingRight` bound to the margin token drives thumb
position automatically across densities. The auto-layout centering
(`counterAxisAlignItems = CENTER`) is equivalent to `y = thumbMargin` because
`thumbSize = trackHeight − 2 × thumbMargin` by construction.

## Geometry gotchas

- **x=0 clamp gotcha**: Adding `layoutMode = "HORIZONTAL"` to an existing
  frame in-place clamps any child at a negative x/y to 0 during the layout
  transition. Ring frames at x=−2/−4 silently move to x=0, making the ring
  appear asymmetric (flush-left, overflowing right). Fix: always explicitly
  set `gapFr.x = -2; ringFr.x = -4` *after* `layoutMode` is set, and again
  after every clone-and-rebind sweep.
- **`layoutPositioning = "ABSOLUTE"` requires a layout parent**: setting it
  on a child of a `layoutMode = NONE` frame throws. Add `layoutMode` to the
  parent first, *then* set children to ABSOLUTE.
- **Instance-sublayer override matrix (plugin API).** On an *instance's* children you
  CAN override `resize()`, `layoutGrow`/`layoutSizing*`, `visible`, and component
  properties — but NOT **position**: `set_x`/`set_y` throw "cannot be overridden in
  an instance". So a per-instance value/position feature must come from variants or
  from auto-layout *sizing* (resize a spacer), never from moving a sublayer.
- **`layoutGrow` is binary (0/1).** Weighted/fractional grow is rejected
  ("Expected 0 or 1"), so two FILL children always split 50/50 — you cannot build an
  arbitrary-% spacer that survives resize from FILL alone. Resize-safe arbitrary %
  needs `SCALE` constraints, but `SCALE` also scales the node's *size* (so it shrinks
  a thumb to ~1px on a 6× resize). There is no clean auto-layout route to a
  resize-safe value slider — keep value at a fixed 50% (centred) and detach to move it.
- **Centre a token-sized child through BOTH resize and density.** A child whose w/h is
  bound to a density token resizes **corner-anchored**; `CENTER`/`SCALE` constraints do
  NOT re-centre it on its *own* token resize (constraints only react to *parent* resize).
  Fix that survives both: wrap it in an auto-layout "rail" that **fills the parent**
  (`constraints = STRETCH/STRETCH`, `primaryAxisAlignItems = counterAxisAlignItems =
  CENTER`, both sizing modes FIXED) and make the child a flow item
  (`layoutPositioning = "AUTO"`) — auto-layout re-lays-out on *any* child size change.
  (Slider thumb-rail, 2026-06-01.) An absolute auto-layout frame's FIXED **primary**
  size can also fight instance resizes (it stays at the master size, e.g. 240, and
  overflows) — `rail.resize(inst.w, inst.h)` per instance, or keep `layoutMode` so the
  axis that needs to shrink is the *counter* axis.
- **Copying a paint preserves its variable binding.** `dst.fills = src.fills` carries the
  paint-level `boundVariables.color` across (you do *not* re-bind) — handy when cloning a
  colour element; the binding rule itself is "set on the paint, not via `setBoundVariable`".
