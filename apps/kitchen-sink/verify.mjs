import { chromium } from '@playwright/test';
const browser = await chromium.launch();
// narrower viewport, to reproduce the overflow the wide one hid
const page = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' });
await page.getByRole('heading', { name: 'Data Table', exact: true }).first().scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
const m = await page.evaluate(() => {
  const card = document.querySelector('.primitiv-data-table');
  const scroll = card.querySelector('.primitiv-table__scroll-area');
  const doc = document.documentElement;
  // scroll the sticky area and compare the header cells' offsets
  scroll.scrollTop = 120;
  const head = [...card.querySelectorAll('.primitiv-table__head th')];
  const tops = head.map((h) => Math.round(h.getBoundingClientRect().top));
  const ctl = card.querySelector('.primitiv-table__head .primitiv-data-table__control-cell');
  return {
    docScrollWidth: doc.scrollWidth, docClientWidth: doc.clientWidth,
    pageOverflows: doc.scrollWidth > doc.clientWidth,
    cardWidth: Math.round(card.getBoundingClientRect().width),
    parentWidth: Math.round(card.parentElement.getBoundingClientRect().width),
    scrollsHorizontally: scroll.scrollWidth > scroll.clientWidth,
    headerTopsAllEqual: new Set(tops).size === 1,
    headerTops: tops,
    controlCellClasses: ctl ? ctl.className : null,
    controlCellPosition: ctl ? getComputedStyle(ctl).position : null,
  };
});
console.log(JSON.stringify(m, null, 2));
console.log('page errors:', errs);
await browser.close();
