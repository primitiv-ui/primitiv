# Wireframe script recipes — API patterns, helpers, design tokens

## Key API patterns

### Fills and strokes

Figma fills are arrays of paint objects. Solid colour:

```js
function solid(hex) {
  return [{
    type: "SOLID",
    color: {
      r: parseInt(hex.slice(1,3), 16) / 255,
      g: parseInt(hex.slice(3,5), 16) / 255,
      b: parseInt(hex.slice(5,7), 16) / 255,
    }
  }];
}
```

Semi-transparent fill: add `opacity` to the paint object (0–1).

Dashed strokes: set `node.dashPattern = [dashLength, gapLength]` after
assigning `node.strokes`.

### Text nodes

```js
const t = figma.createText();
t.fontName = { family: "Inter", style: "Regular" };  // must set before characters
t.fontSize = 14;
t.fills = solid("#1E1E1E");
t.characters = "Hello";
t.x = 16;
t.y = 24;
parent.appendChild(t);
```

Text auto-sizes by default. To set a fixed width, set `t.textAutoResize`
and `t.resize(width, height)`.

### Appending to a frame

Nodes are appended with `parent.appendChild(node)`. The node's `x`/`y` is
then relative to the parent frame's top-left corner.

### Corner radius

- `node.cornerRadius = 8` — all corners
- Individual corners: `node.topLeftRadius`, `node.topRightRadius`,
  `node.bottomLeftRadius`, `node.bottomRightRadius`

## The shared helper set

Every wireframe script in this repo uses the same helper set. Copy them from
an existing script (`create-v1-wireframes.js`) rather than re-inventing them:

| Helper | Purpose |
|---|---|
| `solid(hex)` | Returns a Figma fill array for a solid hex colour |
| `solidA(hex, opacity)` | Solid fill with opacity (0–1) |
| `makeFrame(name, x, y, w, h, bg)` | Creates a top-level frame |
| `makeRect(parent, name, x, y, w, h, fill)` | Rectangle appended to parent |
| `makeText(parent, content, x, y, size, style, hex)` | Text appended to parent |
| `makeDivider(parent, x, y, w)` | 1px grey separator line |
| `makeSectionLabel(parent, label, x, y)` | 10px uppercase grey section heading |
| `makeHeader(parent, title, showBack)` | Dark 48px header bar |

## Design tokens used in this project's wireframes

| Token | Value | Use |
|---|---|---|
| Frame background | `#F2F2F2` | All screen backgrounds |
| Header bg | `#1E1E1E` | Dark header bars |
| Header text | `#FFFFFF` | Header title, back arrow |
| Close button bg | `solidA("#FFFFFF", 0.12)` | Header close box |
| Content card bg | `#FFFFFF` | Project items, option cards |
| Content card border | `#E0E0E0` | Default card stroke |
| Selected card border | `#1E1E1E` | Checked/active option cards |
| Divider | `#D8D8D8` | Section separators |
| Section label | `#999999` | Uppercase 10px section headings |
| Body text | `#1E1E1E` | Primary labels |
| Secondary text | `#888888` | Descriptions, dates |
| Muted text | `#AAAAAA` | Hints, placeholders |
| Primary button bg | `#1E1E1E` | Apply, confirm actions |
| Disabled button bg | `#BBBBBB` | Inactive Apply |
| Selection highlight | `#E8E8E8` | Tree row selected state |
| Placeholder bg | `#F8F8F8` | Dashed placeholder sections |

Typography: Inter Regular / Medium / Bold at 10px (labels), 11px
(descriptions), 12–13px (body), 14px (header title), 20px (page headings).
