/*
 * FIGMA-01's browser half — the same four buttons the Figma specimen holds.
 *
 * Its geometry is not "close to" the Figma frame, it IS the Figma frame:
 * `FIGMA-01 specimen — Light` (2222:24532) is a 170x272 auto-layout frame with
 * 32px padding and a 16px gap around four md/default Buttons, and so is this.
 * That is what lets the two halves be composited at one scale and compared edge
 * to edge, which the brief calls "the entire trick".
 *
 * The labels read "Button text" because that is the component's own default in
 * the file, and the two sides have to say the same words.
 */
import { Button } from "@registry/button/button";

const VARIANTS = ["primary", "secondary", "danger", "ghost"] as const;

export function FigmaParity() {
  return (
    <div className="parity-stage">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant} size="md">
          Button text
        </Button>
      ))}
    </div>
  );
}
