/*
 * FIGMA-01 — the Figma file beside the browser, at one scale.
 *
 * The left zone is a CROP of a real screenshot of Figma Desktop, taken on a
 * real machine, because the bridge cannot produce one: both of its screenshot
 * tools export canvas NODES through `exportAsync`, so they render the design and
 * not the application — no properties panel, no selection outline, no toolbar.
 * The panel showing `action/primary/default` as a variable chip rather than a
 * hex is the detail the brief calls the most convincing thing available, and it
 * only exists in an app screenshot.
 *
 * The right zone is not an image at all: it is the live registry Button,
 * rendered by this page from the same token layer the site ships. So the halves
 * are not two pictures that agree, they are a picture and the thing itself.
 *
 * SCALE is the whole trick, and it is arithmetic rather than judgement. The
 * screenshot was taken at 163% zoom on a 2x display, which put the 40px button
 * at 129 device px — measured, not assumed. `--figma-scale` is therefore
 * `SIZE / 129`, and the live half is scaled by `SIZE / 40`. Both halves end up
 * with a button exactly SIZE tall, and a reader comparing edge to edge is
 * comparing like with like.
 */
import { Button } from "@registry/button/button";

/*
 * How tall the button is in the composite, in CSS px at 1x.
 *
 * It is not a free choice: the left zone has to hold the crop at this scale, so
 * SIZE is bounded by (zone width) / (crop width in source px) * 129. Bigger
 * empties less of the frame but narrows the crop — at 38 the panel's `H 40`
 * field fell off the right edge, and `H 40` is the proof for one of the three
 * tokens the band names, so that is not a trade worth making. 33 keeps the
 * whole Resizing row and still fills the frame.
 */
const SIZE = 33;

/**
 * The primary button's measured position and height in the source screenshot,
 * in its own pixels. Measured by finding the brand-blue region, not read off a
 * ruler: the screenshot was taken at 163% zoom on a 2x display, which put the
 * 40px button at 129px. Everything else here is derived from these numbers.
 */
const SHOT_BUTTON = { x: 1474, y: 788, height: 129 };

/** The screenshot's own pixel size. */
const SHOT = { width: 3456, height: 2168 };

/**
 * The region of the screenshot the left zone shows, in source pixels. It starts
 * just left of the specimen frame and ends inside the properties panel — far
 * enough right to keep every variable name, and short of the panel's trailing
 * icons, which carry nothing.
 *
 * Vertically it is bounded at both ends on purpose. It starts at the panel's
 * Resizing row, so `W 106 Hug` and `H 40` are in frame; it ends below Stroke,
 * so `action/primary/border/default` is too. Above and below that lie Figma's
 * floating toolbar and the Export section — recognisable chrome is the point,
 * but chrome about drawing tools is not what this image is about. Cropping to
 * this band also makes the left block roughly the height of the right one,
 * which two zones claiming to be equals need to be.
 */
const CROP = { x: 1300, y: 280, width: 1801, height: 1720 };

const VARIANTS = ["primary", "secondary", "danger", "ghost"] as const;

/** The zone's inner height — the frame less its padding. */
const ZONE_HEIGHT = 600 - 24 * 2 - 34;

/*
 * The three tokens the band names. Each is quoted exactly as the Figma
 * properties panel spells it, because that is what a reader can see on the left
 * — and each governs something visible on both sides.
 */
const TOKENS = [
  { name: "action/primary/default", note: "fill" },
  { name: "framed-control/md/height", note: "40px" },
  { name: "framed-control/md/radius", note: "8px" },
];

/** The stage's own padding, which is what sets the first button's inset. */
const STAGE_PADDING = 32;

export function FigmaOne({ theme }: { theme: "light" | "dark" }) {
  const figmaScale = SIZE / SHOT_BUTTON.height;
  const liveScale = SIZE / 40;

  /*
   * Both halves are placed so their PRIMARY BUTTONS share a baseline. Centring
   * the two blocks independently does not achieve that — the screenshot carries
   * a frame label and canvas margin above its buttons and the live stage does
   * not — and a band claiming the two sides agree, drawn across two rows that
   * visibly do not line up, argues against itself.
   */
  const cropWidth = CROP.width * figmaScale;
  const cropHeight = CROP.height * figmaScale;
  const cropTop = (ZONE_HEIGHT - cropHeight) / 2;
  const buttonTop = cropTop + (SHOT_BUTTON.y - CROP.y) * figmaScale;
  const stageTop = buttonTop - STAGE_PADDING * liveScale;

  return (
    <div className="parity">
      <div className="parity__figma" style={{ width: cropWidth, height: cropHeight, marginTop: cropTop }}>
        <img
          src={`/@fs${new URL(`../out/figma-01/${theme}.png`, import.meta.url).pathname}`}
          alt=""
          style={{
            width: SHOT.width * figmaScale,
            height: SHOT.height * figmaScale,
            marginLeft: -CROP.x * figmaScale,
            marginTop: -CROP.y * figmaScale,
          }}
        />
      </div>

      <div className="parity__band">
        {TOKENS.map(({ name, note }) => (
          <div className="parity__token" key={name}>
            <span className="parity__rule parity__rule--left" />
            <span className="parity__name">
              {name}
              <span className="parity__note">{note}</span>
            </span>
            <span className="parity__rule parity__rule--right" />
          </div>
        ))}
      </div>

      <div className="parity__browser">
        <div
          className="parity-stage"
          style={{
            transform: `scale(${liveScale})`,
            transformOrigin: "top left",
            marginTop: stageTop,
          }}
        >
          {VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} size="md">
              Button text
            </Button>
          ))}
        </div>
      </div>

      <p className="parity__caption">The same three tokens, on both sides.</p>
    </div>
  );
}
