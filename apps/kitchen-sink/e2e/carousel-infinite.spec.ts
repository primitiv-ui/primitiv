import { test, expect, type Locator, type Page } from "@playwright/test";

// Real-browser coverage for the Carousel `loop="infinite"` surface (kitchen-sink
// cell 7 = single-slide, 4 real slides). These assert what jsdom can't: that a
// wrap actually *settles on a real slide* with real scroll-snap geometry, rather
// than stranding the viewport on a clone in the edge buffer. Run under `webkit`
// / `mobile-safari` too (where installable) to catch the iOS-only snap quirks a
// plain Chromium hides.
//
// The wrap is async (teleport → smooth glide → scrollend → recentre), so every
// settle assertion *polls* via expect().toPass() rather than sleeping a guessed
// duration — a fixed wait flakes across engines and under CI load.

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

/**
 * Wait until the loop has *settled* on real slide `index`: the active page
 * tracks it AND the viewport centre rests on the real slide, never a clone.
 * Polls because the wrap is a teleport → smooth glide → scrollend → recentre
 * chain whose duration varies by engine and CI load.
 */
async function expectSettledOn(cell: Locator, index: number): Promise<void> {
  await expect(async () => {
    expect(await activeRealIndex(cell)).toBe(index);
    const centered = await centeredSlide(cell);
    expect(centered.isClone).toBe(false);
    expect(centered.realIndex).toBe(index);
  }).toPass({ timeout: 5_000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/carousel/loop");
  await infiniteCell(page).locator(".primitiv-carousel__viewport").waitFor();
});

test("starts positioned on the real first slide, not a leading clone", async ({
  page,
}) => {
  await expectSettledOn(infiniteCell(page), 0);
});

test("Next past the last slide wraps onto the REAL first slide", async ({
  page,
}) => {
  const cell = infiniteCell(page);
  const next = cell.getByLabel("Next slide");
  // 4 real slides: 0→1→2→3, then the 4th Next wraps 3→0. Settle between clicks
  // so each starts from a real resting position, like a user tapping through.
  for (let target = 1; target <= 4; target++) {
    await next.click();
    await expectSettledOn(cell, target % 4);
  }
});

test("Previous before the first slide wraps onto the REAL last slide", async ({
  page,
}) => {
  const cell = infiniteCell(page);
  await cell.getByLabel("Previous slide").click();
  // The crux of the iOS bug: Previous from the first slide must land on the REAL
  // last slide, never stranded on a clone in the buffer.
  await expectSettledOn(cell, 3);
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
    await expectSettledOn(cell, step % 4);
  }
});
