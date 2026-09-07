"""
Convert a Display P3 screenshot to sRGB.

FIGMA-01 puts a screenshot of Figma beside a browser render and claims the two
cannot disagree about a colour. A macOS screenshot is tagged **Display P3**, so
the same `#236ce1` that the file stores comes out of the PNG as `(57, 107, 217)`
— and pasted next to an sRGB render it is visibly a different blue. Left
uncorrected, the image would appear to refute its own argument, and it would
look like token drift when it is nothing of the kind.

The conversion is the standard one: decode the sRGB transfer curve (Display P3
uses the same curve), P3 primaries -> XYZ (D65) -> sRGB primaries, re-encode.

It is self-checking. `--expect RRGGBB` asserts that the most common colour
inside `--check-box` lands on that value afterwards, so a wrong profile guess
fails loudly instead of shifting every colour a little. The tolerance is +/-1
per channel: the round trip crosses two gamma curves at 8 bits, so an exact
match is not available — the first run landed on #236de1, one unit of green off
#236ce1. A wrong profile misses by far more than that (uncorrected, the same
pixel reads #396bd9, 22 units of red away).

Usage:
  python3 p3-to-srgb.py in.png out.png [--expect 236ce1 --check-box x0 y0 x1 y1]
"""

import argparse
import subprocess
import sys
from collections import Counter

import numpy as np

FFMPEG = "/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"

# Display P3 -> XYZ (D65), then XYZ -> linear sRGB. Folded into one matrix.
P3_TO_XYZ = np.array([
    [0.4865709, 0.2656677, 0.1982173],
    [0.2289746, 0.6917385, 0.0792869],
    [0.0000000, 0.0451134, 1.0439444],
])
XYZ_TO_SRGB = np.array([
    [3.2404542, -1.5371385, -0.4985314],
    [-0.9692660, 1.8760108, 0.0415560],
    [0.0556434, -0.2040259, 1.0572252],
])
P3_TO_SRGB = XYZ_TO_SRGB @ P3_TO_XYZ


def size_of(path):
    out = subprocess.run([FFMPEG, "-hide_banner", "-i", path], capture_output=True).stderr.decode()
    for token in out.split():
        if "x" in token and token.replace(",", "").replace("x", "").isdigit():
            w, h = token.replace(",", "").split("x")
            return int(w), int(h)
    raise SystemExit(f"could not read the size of {path}")


def decode(c):
    """sRGB / Display P3 transfer curve, to linear light."""
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def encode(c):
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.clip(c, 0, None) ** (1 / 2.4) - 0.055)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dest")
    ap.add_argument("--expect", help="hex the check box should land on, e.g. 236ce1")
    ap.add_argument("--check-box", nargs=4, type=int, metavar=("X0", "Y0", "X1", "Y1"))
    args = ap.parse_args()

    w, h = size_of(args.src)
    raw = subprocess.run(
        [FFMPEG, "-v", "error", "-i", args.src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True,
    ).stdout
    img = np.frombuffer(raw, dtype=np.uint8).reshape(h, w, 3).astype(np.float64) / 255.0

    converted = encode(decode(img) @ P3_TO_SRGB.T)
    out = np.clip(converted * 255.0, 0, 255).round().astype(np.uint8)

    if args.expect and args.check_box:
        x0, y0, x1, y1 = args.check_box
        patch = out[y0:y1, x0:x1].reshape(-1, 3)
        common = Counter(map(tuple, patch)).most_common(1)[0][0]
        got = "%02x%02x%02x" % common
        want = tuple(int(args.expect[i : i + 2], 16) for i in (0, 2, 4))
        drift = max(abs(a - b) for a, b in zip(common, want))
        print(f"check box -> #{got} (expected #{args.expect}, off by {drift})")
        if drift > 1:
            sys.exit(
                f"conversion landed on #{got}, {drift} away from #{args.expect} — "
                "the source is not Display P3"
            )

    subprocess.run(
        [FFMPEG, "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{w}x{h}", "-i", "-", args.dest],
        input=out.tobytes(), check=True,
    )
    print(f"wrote {args.dest} ({w}x{h})")


if __name__ == "__main__":
    main()
