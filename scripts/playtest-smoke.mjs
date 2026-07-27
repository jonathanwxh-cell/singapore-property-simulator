import { clickCompactNav, expectVisible, gotoRoute, startQuickGame, withPlayPage } from './playtest-helpers.mjs';

async function run() {
  await withPlayPage(async (page, baseUrl) => {
    await gotoRoute(page, `${baseUrl}/#/`);
    await expectVisible(page, 'text=Property');
    await expectVisible(page, 'text=Start your story');
    await expectVisible(page, 'text=Quick start');

    // Old dashboard-style routes should fall through to the compact title shell.
    await gotoRoute(page, `${baseUrl}/#/dashboard`);
    await expectVisible(page, 'text=Property');
    await expectVisible(page, 'text=Start your story');

    await startQuickGame(page, baseUrl);
    await expectVisible(page, 'text=Life Board');
    await expectVisible(page, 'text=Choose this month');
    await clickCompactNav(page, 'Market');
    await expectVisible(page, 'text=The market');
    await expectVisible(page, 'text=Sort');
    await expectVisible(page, 'text=Your best first move');

    await page.getByRole('button', { name: /^Buy$/ }).first().click();
    await expectVisible(page, "text=It's yours!");
    await page.getByRole('button', { name: 'Done' }).click();

    await clickCompactNav(page, 'Places');
    await expectVisible(page, 'text=Your places');
    await expectVisible(page, 'text=Northstar Grove 3-Room');
    await page.locator('button').filter({ hasText: 'Northstar Grove 3-Room' }).first().click();
    await expectVisible(page, 'text=Whole-flat rental locked');
    await page.getByRole('button', { name: /Rent a room/i }).click();
    await expectVisible(page, 'text=Room-rental lease signed');
    await expectVisible(page, 'text=End lease');
    await expectVisible(page, 'text=Renovate');

    await page.getByRole('button', { name: 'Close' }).click();
    await clickCompactNav(page, 'Bank');
    await expectVisible(page, 'text=The bank');
    await expectVisible(page, 'text=Total owed');

    await page.getByRole('button', { name: 'Close' }).click();
    await expectVisible(page, 'text=Next Month');
  });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
