import { test, expect, type Locator, type Page } from "@playwright/test";

// Real-browser coverage for the Carousel `loop="infinite"` surface (kitchen-sink
// cell 7 = single-slide, 4 real slides). These assert what jsdom can't: that a
// wrap actually *settles on a real slide* with real scroll-snap geometry, rather
// than stranding the viewport on a clone in the edge buffer. Run under `webkit`
// / `mobile-safari` too (where installable) to catch the iOS-only snap quirks a
// plain Chromium hides.

/** The cell 7 carousel root ("Infinite — continuous glide"). */
function infiniteCell(page: Page): Locator {
  return page.locator(".carousel-grid__cell", {
    hasText: "Infinite — continuous glide",
  });
}

/**
 * Which slide currently sits under the viewport centre, and whether it's a
 * clone. A correct infinite loop always *settles* on a real slide (the recentre
 * teleports the pixels back) — a clone here is the "stranded wrap" bug.
 */
async function centeredSlide(
  cell: Locator,
): Promise<{ realIndex: number; isClone: boolean }> {
  return cell.evaluate((root) => {
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
    const cloneOf = best?.getAttribute("data-clone-of");
    return {
      realIndex: Number(cloneOf ?? best?.getAttribute("data-index")),
      isClone: cloneOf !== null && cloneOf !== undefined,
    };
  });
}

/** The zero-based index of the active REAL slide (React's currentPage). */
async function activeRealIndex(cell: Locator): Promise<number> {
  const active = cell.locator(
    '[data-carousel-slide][data-state="active"]:not([data-clone-of])',
  );
  return Number(await active.getAttribute("data-index"));
}

test.beforeEach(async ({ page }) => {
  await page.goto("/carousel/loop");
  // Let the first infinite scroll position onto the real middle copy.
  await infiniteCell(page).locator(".primitiv-carousel__viewport").waitFor();
  await page.waitForTimeout(300);
});

test("starts positioned on the real first slide, not a leading clone", async ({
  page,
}) => {
  const cell = infiniteCell(page);
  const centered = await centeredSlide(cell);
  expect(centered.realIndex).toBe(0);
  expect(centered.isClone).toBe(false);
});

test("Next past the last slide wraps onto the REAL first slide", async ({
  page,
}) => {
  const cell = infiniteCell(page);
  const next = cell.getByLabel("Next slide");
  // 4 real slides: 0→1→2→3, then the 4th Next wraps 3→0.
  for (let i = 0; i < 4; i++) {
    await next.click();
    await page.waitForTimeout(600); // teleport-then-glide + scrollend recentre
  }
  expect(await activeRealIndex(cell)).toBe(0);
  const centered = await centeredSlide(cell);
  expect(centered.realIndex).toBe(0);
  // The crux of the iOS bug: after the wrap the viewport must rest on the REAL
  // slide, never stranded on a clone in the buffer.
  expect(centered.isClone).toBe(false);
});

test("Previous before the first slide wraps onto the REAL last slide", async ({
  page,
}) => {
  const cell = infiniteCell(page);
  await cell.getByLabel("Previous slide").click();
  await page.waitForTimeout(600);
  expect(await activeRealIndex(cell)).toBe(3);
  const centered = await centeredSlide(cell);
  expect(centered.realIndex).toBe(3);
  expect(centered.isClone).toBe(false);
});

test("clicking all the way around returns to a real slide every step", async ({
  page,
}) => {
  const cell = infiniteCell(page);
  const next = cell.getByLabel("Next slide");
  // Two full laps — every settle must land on a real slide (no drift into the
  // clone buffer as the active page cycles 0..3 twice).
  for (let step = 1; step <= 8; step++) {
    await next.click();
    await page.waitForTimeout(600);
    const centered = await centeredSlide(cell);
    expect(centered.isClone, `step ${step} settled on a clone`).toBe(false);
    expect(centered.realIndex).toBe(step % 4);
    expect(await activeRealIndex(cell)).toBe(step % 4);
  }
});
