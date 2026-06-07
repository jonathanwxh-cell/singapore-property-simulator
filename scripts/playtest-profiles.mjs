import { clickCompactNav, expectVisible, startConfiguredGame, withPlayPage } from './playtest-helpers.mjs';

const profiles = [
  {
    name: 'SC Family QA',
    householdLabel: 'Couple / Family',
    residencyLabel: 'Singapore Citizen',
    expected: ['SC Family QA', 'Singapore Citizen', 'Couple / Family'],
  },
  {
    name: 'Single QA',
    householdLabel: 'Single Under 35',
    residencyLabel: 'Singapore Citizen',
    expected: ['Single QA', 'Singapore Citizen', 'Single Under 35'],
  },
  {
    name: 'Foreigner QA',
    householdLabel: 'Foreign Investor',
    residencyLabel: 'Foreigner',
    expected: ['Foreigner QA', 'Foreigner', 'Foreign Investor'],
  },
  {
    name: 'PR QA',
    householdLabel: 'Couple / Family',
    residencyLabel: 'Singapore PR',
    expected: ['PR QA', 'Singapore PR', 'Couple / Family'],
  },
];

async function run() {
  await withPlayPage(async (page, baseUrl) => {
    for (const profile of profiles) {
      await startConfiguredGame(page, baseUrl, profile);
      await clickCompactNav(page, 'You');
      await expectVisible(page, 'text=Journey to freedom');

      for (const expectedText of profile.expected) {
        await expectVisible(page, `text=${expectedText}`);
      }

      await page.getByRole('button', { name: 'Close' }).click();
    }
  }, { width: 430, height: 900 });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
