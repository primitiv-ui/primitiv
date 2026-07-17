import { test, expect, type Locator, type Page } from "@playwright/test";

// Real-browser coverage for the Carousel infinite loop's DRAG / FLING layer
// (useCarouselLoop's pointer handlers). jsdom lays nothing out, so the unit tests
// mock geometry and can only check the control flow; these drive real pointer
// input against the built kitchen-sink so the actual settle geometry is
// exercised. Run under `webkit` / `mobile-safari` too (iOS Safari's engine core).
//
// Cell 7 ("Infinite — continuous glide") is single-slide, 4 real slides, and sets
// `allowMouseDrag`, so a mouse gesture drives the same path touch does. Cell 13
// ("Infinite + linked slides") fills each slide with an anchor for the
// tap-through case.
//
// NOTE ON VELOCITY: a fling's *distance* depends on the release velocity, which
// no engine reproduces from real touch momentum and which varies with dispatch
// timing. So the fling tests assert the robust invariants — direction (a leftward
// drag advances forward) and a clean settle on a REAL slide (never stranded
// mid-track) — not an exact landing page. The overshoot magnitude stays a
// real-device check.

function cell(page: Page, title: string): Locator {
  return page.locator(".carousel-grid__cell", { hasText: title });
}

const infiniteDragCell = (page: Page) =>
  cell(page, "Infinite — continuous glide");
const linkedCell = (page: Page) => cell(page, "Infinite + linked slides");

/** The zero-based index of the active REAL slide (React's currentPage). */
async function activeRealIndex(c: Locator): Promise<number> {
  const active = c.locator(
    '[data-carousel-slide][data-state="active"]:not([data-carousel-clone])',
  );
  return Number(await active.getAttribute("data-index"));
}

/**
 * Which real slide sits under the viewport centre, and how far off-centre it is.
 * A settled loop rests with a real slide dead-centre; a positive `offset` beyond
 * a couple of px means the track is stranded between slides (the bug).
 */
async function centeredSlide(
  c: Locator,
): Promise<{ realIndex: number; isClone: boolean; offset: number }> {
  return c.evaluate((root) => {
    const vp = root.querySelector<HTMLElement>(".primitiv-carousel__viewport")!;
    const vpRect = vp.getBoundingClientRect();
    const vpCenter = vpRect.left + vpRect.width / 2;
    const slides = Array.from(
      vp.querySelectorAll<HTMLElement>("[data-carousel-slide]"),
    );
    let best: HTMLElement | null = null;
    let bestDistance = Infinity;
    for (const slide of slides) {
      const rect = slide.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - vpCenter);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = slide;
      }
    }
    // A clone-strip copy is tagged data-carousel-clone (its data-index stripped);
    // a correct loop re-bases so a REAL slide rests under the centre at settle.
    const isClone = best?.hasAttribute("data-carousel-clone") ?? false;
    return {
      realIndex: Number(best?.getAttribute("data-index")),
      isClone,
      offset: bestDistance,
    };
  });
}

/** Poll until the loop has settled on real slide `index`, dead-centre. */
async function expectSettledOn(c: Locator, index: number): Promise<void> {
  await expect(async () => {
    expect(await activeRealIndex(c)).toBe(index);
    const centered = await centeredSlide(c);
    expect(centered.isClone).toBe(false);
    expect(centered.realIndex).toBe(index);
    expect(centered.offset).toBeLessThan(2);
  }).toPass({ timeout: 5_000 });
}

/** Poll until the loop has settled on ANY real slide, dead-centre. */
async function expectSettledClean(c: Locator): Promise<number> {
  let landed = -1;
  await expect(async () => {
    const centered = await centeredSlide(c);
    expect(centered.isClone).toBe(false);
    expect(centered.offset).toBeLessThan(2);
    expect(await activeRealIndex(c)).toBe(centered.realIndex);
    landed = centered.realIndex;
  }).toPass({ timeout: 5_000 });
  return landed;
}

/**
 * Drive a horizontal mouse drag across the cell's viewport: press at its centre,
 * move `dx` px (negative = leftward = forward) over `steps` moves spaced `delay`
 * ms apart, release. The delay shapes the release velocity, hence the fling: a
 * long delay makes the last leg slow (a near-distance-only settle), a short one
 * carries momentum (a flick).
 */
async function dragViewport(
  page: Page,
  c: Locator,
  { dx, steps, delay }: { dx: number; steps: number; delay: number },
): Promise<void> {
  const vp = c.locator(".primitiv-carousel__viewport");
  // Raw page.mouse input (unlike .click()) does NOT auto-scroll its target into
  // view, and the loop cells sit well below the fold — scroll first, or the press
  // lands on empty space above the carousel and nothing drags.
  await vp.scrollIntoViewIfNeeded();
  const box = (await vp.boundingBox())!;
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(startX, y);
  await page.mouse.down();
  for (let step = 1; step <= steps; step++) {
    await page.mouse.move(startX + (dx * step) / steps, y);
    await page.waitForTimeout(delay);
  }
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/carousel/loop");
  await infiniteDragCell(page).locator(".primitiv-carousel__viewport").waitFor();
});

test("a slow drag past the halfway point advances one page", async ({
  page,
}) => {
  const c = infiniteDragCell(page);
  await expectSettledOn(c, 0);
  // A single slide fills the viewport, so half a stride is ~half the width. Drag
  // 70% of the way with a slow last leg (small fling), well past the halfway
  // point → it settles on the next slide.
  const box = (await c
    .locator(".primitiv-carousel__viewport")
    .boundingBox())!;
  await dragViewport(page, c, { dx: -box.width * 0.7, steps: 12, delay: 25 });
  await expectSettledOn(c, 1);
});

test("a small slow drag settles back to the start", async ({ page }) => {
  const c = infiniteDragCell(page);
  await expectSettledOn(c, 0);
  const box = (await c
    .locator(".primitiv-carousel__viewport")
    .boundingBox())!;
  // Well under half a stride, released with a slow last leg → snaps back home.
  await dragViewport(page, c, { dx: -box.width * 0.2, steps: 12, delay: 25 });
  await expectSettledOn(c, 0);
});

test("a fast flick advances forward and settles cleanly on a real slide", async ({
  page,
}) => {
  const c = infiniteDragCell(page);
  await expectSettledOn(c, 0);
  const box = (await c
    .locator(".primitiv-carousel__viewport")
    .boundingBox())!;
  // A short, quick leftward flick: the distance alone is under half a stride, so a
  // forward advance proves the velocity-projected fling carried it. The short
  // per-move delay bounds the velocity so it advances a slide or two rather than
  // wrapping unpredictably; direction is deterministic, exact landing isn't, so
  // assert only that it advanced off slide 0 and settled dead-centre on a real one.
  await dragViewport(page, c, { dx: -box.width * 0.4, steps: 5, delay: 10 });
  const landed = await expectSettledClean(c);
  expect(landed).not.toBe(0);
});

test("the end buttons still wrap when the drag layer is enabled", async ({
  page,
}) => {
  const c = infiniteDragCell(page);
  await expectSettledOn(c, 0);
  // Prev / Next live outside the viewport, so the pointer-drag handlers must not
  // shadow them: Prev from the first slide wraps to the real last, and Next from
  // the last wraps back to the real first.
  await c.getByLabel("Previous slide").click();
  await expectSettledOn(c, 3);
  await c.getByLabel("Next slide").click();
  await expectSettledOn(c, 0);
});

test("a tap on a linked slide reaches the link", async ({ page }) => {
  const c = linkedCell(page);
  await c.locator(".primitiv-carousel__viewport").waitFor();
  await expectSettledOn(c, 0);
  // A tap (no pointer travel) is under the drag threshold, so the click is never
  // suppressed and the slide's anchor navigates.
  await c.getByTestId("slide-link-0").click();
  await expect(page).toHaveURL(/#slide-0$/);
});

test("a drag that starts on a linked slide steers the track, not the link", async ({
  page,
}) => {
  const c = linkedCell(page);
  await c.locator(".primitiv-carousel__viewport").waitFor();
  await expectSettledOn(c, 0);
  const box = (await c
    .locator(".primitiv-carousel__viewport")
    .boundingBox())!;
  // Press ON the link and drag past the threshold: the gesture must steer the
  // carousel (advance a page) and suppress the anchor's click — the URL keeps no
  // #slide hash.
  await dragViewport(page, c, { dx: -box.width * 0.7, steps: 12, delay: 25 });
  await expectSettledOn(c, 1);
  expect(page.url()).not.toContain("#slide");
});
