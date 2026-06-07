import { clickCompactNav, expectVisible, startQuickGame, withPlayPage } from './playtest-helpers.mjs';

async function run() {
  await withPlayPage(async (page, baseUrl) => {
    await startQuickGame(page, baseUrl);
    await clickCompactNav(page, 'Market');
    await expectVisible(page, 'text=The market');

    const sheetScroller = page.locator('.overflow-y-auto').last();
    await sheetScroller.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    const scrolledBeforeClose = await sheetScroller.evaluate((element) => element.scrollTop);
    if (scrolledBeforeClose < 200) {
      throw new Error(`Setup failed: market sheet did not scroll deeply, got ${scrolledBeforeClose}.`);
    }

    await page.getByRole('button', { name: 'Close' }).click();
    await expectVisible(page, 'text=Next Month');
    await clickCompactNav(page, 'Market');
    await expectVisible(page, 'text=Sort');

    const reopenedScroller = page.locator('.overflow-y-auto').last();
    const reopenedScrollTop = await reopenedScroller.evaluate((element) => element.scrollTop);
    if (reopenedScrollTop > 2) {
      throw new Error(`Expected market sheet to reopen at top, got ${reopenedScrollTop}.`);
    }
  }, { width: 360, height: 640 });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
