import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { createDevServerCommand, createWindowsKillCommand } from './playtest-platform.mjs';

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Could not determine an available port.'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

function startDevServer(port) {
  const { command, args, options } = createDevServerCommand(port);
  const child = spawn(command, args, options);

  child.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  return child;
}

async function stopDevServer(child) {
  if (!child?.pid) return;
  if (process.platform !== 'win32') {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
    await delay(500);
    return;
  }

  const { command, args } = createWindowsKillCommand(child.pid);
  await new Promise((resolve) => {
    const killer = spawn(command, args, {
      stdio: 'ignore',
      shell: false,
    });
    killer.on('exit', resolve);
    killer.on('error', resolve);
  });
}

async function waitForServer(baseUrl) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function expectVisible(page, selector, timeout = 15000) {
  await page.waitForSelector(selector, { timeout });
}

async function expectAnyVisible(page, selectors, timeout = 15000) {
  for (const selector of selectors) {
    try {
      await expectVisible(page, selector, timeout);
      return;
    } catch {
      // keep trying alternate selectors
    }
  }
  throw new Error(`Expected one of these selectors visible: ${selectors.join(' | ')}`);
}

async function openAdvancedDashboardPanels(page) {
  const advancedPanelsButton = page.getByRole('button', { name: /Open advanced sim panels/i });
  if ((await advancedPanelsButton.count()) === 0) return;

  await advancedPanelsButton.scrollIntoViewIfNeeded();
  await advancedPanelsButton.click();

  try {
    await expectVisible(page, 'text=Market Pulse', 5000);
    return;
  } catch {
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')]
        .find((candidate) => candidate.textContent?.toLowerCase().includes('open advanced sim panels'));
      button?.click();
    });
  }

  await expectVisible(page, 'text=Market Pulse', 20000);
}

async function resolveScenarioIfPresent(page) {
  const optionButtons = page.locator('div.fixed.inset-0 button.group.w-full.text-left:visible:not([disabled])');
  if (await optionButtons.count()) {
    await optionButtons.first().click();
    await expectVisible(page, 'text=Scenario Resolved');
    await page.getByRole('button', { name: 'Continue' }).click();
    await delay(250);
  }
}

async function clickAdvance(page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const button = page.getByRole('button', { name: /Advance to/i }).first();
      await button.waitFor({ state: 'visible', timeout: 15000 });
      await delay(150);
      await button.click();
      return;
    } catch (error) {
      if (attempt === 2) {
        console.error(`Advance button not found at ${page.url()}`);
        console.error((await page.locator('body').innerText()).slice(0, 1200));
        throw error;
      }
      await delay(300);
    }
  }
}

function boxesOverlap(a, b) {
  if (!a || !b) return false;
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

async function getVisibleButtonBoxesWithText(page, text) {
  return page.locator('button').evaluateAll((buttons, targetText) => (
    buttons
      .map((button) => {
        const rect = button.getBoundingClientRect();
        const label = button.getAttribute('aria-label') ?? '';
        return {
          text: button.innerText,
          label,
          box: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        };
      })
      .filter(({ text, label, box }) => (
        `${text} ${label}`.toUpperCase().includes(String(targetText).toUpperCase())
        && box.width > 0
        && box.height > 0
      ))
  ), text);
}

async function assertMobileDashboardAdvanceDoesNotCoverVitals(page, viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport);
  await delay(150);

  const advanceButtons = await getVisibleButtonBoxesWithText(page, 'Advance to');
  if (advanceButtons.length !== 1) {
    throw new Error(`Mobile dashboard should expose one visible Next Month CTA, got ${advanceButtons.length}.`);
  }

  const vitalCards = [
    page.locator('div.rounded-2xl').filter({ hasText: 'Spendable Cash' }).first(),
    page.locator('div.rounded-2xl').filter({ hasText: 'Monthly Surplus' }).first(),
  ];
  const ctaBox = advanceButtons[0].box;

  for (const card of vitalCards) {
    const cardText = await card.innerText();
    const cardBox = await card.boundingBox();
    if (boxesOverlap(ctaBox, cardBox)) {
      throw new Error(`Mobile Next Month CTA overlaps the ${cardText.split('\n')[0]} stat card.`);
    }
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function assertVisibleAdvanceExists(page, routeLabel) {
  const advanceButtons = [
    ...await getVisibleButtonBoxesWithText(page, 'Next Month'),
    ...await getVisibleButtonBoxesWithText(page, 'Advance to'),
  ];
  if (advanceButtons.length < 1) {
    throw new Error(`${routeLabel} should expose at least one visible Next Month CTA.`);
  }
}

async function assertMobileAdvanceClearsBottomNav(page, routeLabel, viewport = { width: 390, height: 844 }) {
  await page.setViewportSize(viewport);
  await delay(150);

  const navBox = await page.locator('nav.fixed.bottom-0').boundingBox();
  const advanceButtons = await getVisibleButtonBoxesWithText(page, 'Advance to');
  if (advanceButtons.length !== 1) {
    throw new Error(`Mobile ${routeLabel} should expose one visible Next Month CTA, got ${advanceButtons.length}.`);
  }

  if (boxesOverlap(navBox, advanceButtons[0].box)) {
    throw new Error(`Mobile ${routeLabel} Next Month CTA overlaps the bottom navigation.`);
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function assertMobileScenarioCanScroll(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await delay(150);

  const modalState = await page.locator('div.fixed.inset-0').first().evaluate((modal) => {
    const content = modal.firstElementChild;
    const modalStyle = window.getComputedStyle(modal);
    const contentBox = content?.getBoundingClientRect();
    return {
      overflowY: modalStyle.overflowY,
      contentTop: contentBox?.top ?? 0,
      contentBottom: contentBox?.bottom ?? 0,
      viewportHeight: window.innerHeight,
    };
  });

  const contentClips = modalState.contentTop < 0 || modalState.contentBottom > modalState.viewportHeight;
  const canScroll = modalState.overflowY === 'auto' || modalState.overflowY === 'scroll';
  if (contentClips && !canScroll) {
    throw new Error('Mobile scenario modal content clips without a scrollable overlay.');
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function assertMobilePropertiesHeroActionsClearNav(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await delay(150);

  const navBox = await page.locator('nav.fixed.bottom-0').boundingBox();
  const reviewDealBox = await page.getByRole('button', { name: 'Review Deal' }).boundingBox();
  const starterListBox = await page.getByRole('button', { name: 'Starter List' }).boundingBox();
  if (boxesOverlap(navBox, reviewDealBox) || boxesOverlap(navBox, starterListBox)) {
    throw new Error('Mobile Buy page hero actions overlap the bottom navigation.');
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function assertMobileBuyCtaIsInFlow(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await delay(150);

  const fixedButtonCount = await page.getByRole('button', { name: 'Buy Property' }).evaluateAll((buttons) => {
    return buttons.filter((button) => {
      const rect = button.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;

      let node = button;
      while (node) {
        if (window.getComputedStyle(node).position === 'fixed') return true;
        node = node.parentElement;
      }
      return false;
    }).length;
  });

  if (fixedButtonCount > 0) {
    throw new Error('Mobile Buy Property CTA should be in-flow, not a fixed overlay over purchase math.');
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function assertMobileRouteHasNoVisibleAdvance(page, routeLabel) {
  await page.setViewportSize({ width: 390, height: 844 });
  await delay(150);

  const advanceButtons = await getVisibleButtonBoxesWithText(page, 'Advance to');
  if (advanceButtons.length > 0) {
    throw new Error(`Mobile ${routeLabel} should not show a floating Advance CTA over content.`);
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function assertManualLoadPromotesAutosave(page) {
  await page.goto(`${page.url().split('/#/')[0]}/#/saveload`, { waitUntil: 'networkidle' });
  await expectVisible(page, 'text=Save / Load Game');
  page.once('dialog', (dialog) => dialog.accept('QA Checkpoint'));
  await page.getByRole('button', { name: /^Save$/ }).first().click();
  await expectVisible(page, 'text=QA Checkpoint');

  await page.goto(`${page.url().split('/#/')[0]}/#/dashboard`, { waitUntil: 'networkidle' });
  await clickAdvance(page);
  await resolveScenarioIfPresent(page);

  await page.goto(`${page.url().split('/#/')[0]}/#/saveload`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Load$/ }).first().click();
  await expectVisible(page, 'text=Turn 12');

  await page.reload({ waitUntil: 'networkidle' });
  await expectVisible(page, 'text=Turn 12');
}

async function assertNewGameStepResetsMobileScroll(page) {
  await page.setViewportSize({ width: 393, height: 520 });
  await delay(150);
  const main = page.locator('main');
  await main.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  await page.getByRole('button', { name: /^Next$/ }).click();
  await expectVisible(page, 'text=Choose Your Life Arc');
  await delay(150);

  const scrollTop = await main.evaluate((element) => element.scrollTop);
  if (scrollTop > 2) {
    throw new Error(`New Game mobile step should reset scroll to top, got ${scrollTop}.`);
  }

  await page.setViewportSize({ width: 1440, height: 1100 });
}

async function run() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startDevServer(port);
  let browser;
  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

    await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Fictional property names');
    await expectVisible(page, 'text=Start Guided Run');

    await page.getByRole('button', { name: 'Start Guided Run' }).click();
    await expectVisible(page, 'text=Home Command Center');
    await expectVisible(page, 'text=This Month');

    await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: 'How to Play' }).click();
    await expectVisible(page, 'text=How to Play');
    await expectVisible(page, 'text=Who This Game Is For');
    await expectVisible(page, 'text=Quickstart');
    await expectVisible(page, 'text=Terms You Will See Early');

    await page.getByRole('button', { name: 'Learn the Rules' }).click();
    await expectVisible(page, 'text=Learn Singapore Property Without Prereqs');
    await expectVisible(page, 'text=Who this game is for');
    await expectVisible(page, "text=Additional Buyer's Stamp Duty");
    await page.getByRole('button', { name: /Explain ABSD/i }).first().click();
    await expectVisible(page, 'text=Why it matters');

    await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=New Game');

    await page.getByRole('button', { name: 'New Game' }).click();
    await page.getByPlaceholder('Enter your name...').fill('Codex QA');
    await expectVisible(page, 'text=Start Recommended Run');
    await page.getByRole('button', { name: 'Customize Run' }).click();
    await page.getByRole('button', { name: /^Next$/ }).click();
    await expectVisible(page, 'text=Choose Buyer Profile');
    await assertNewGameStepResetsMobileScroll(page);
    await expectVisible(page, 'text=Choose Your Life Arc');
    await expectVisible(page, 'text=BTO-to-Condo Upgrader');
    await page.getByRole('button', { name: /^Next$/ }).click();
    await expectVisible(page, 'text=Select Difficulty');
    await page.getByRole('button', { name: /Start Game/i }).click();

    await expectVisible(page, 'text=Home Command Center');
    await expectVisible(page, 'text=This Month');
    await expectAnyVisible(page, ['text=Beginner focus mode', 'text=Guided mode primer', 'text=Beginner quest']);
    await expectVisible(page, 'text=Campaign Chapter');
    await expectVisible(page, 'text=Current Mission');
    await expectVisible(page, 'text=Campaign Score');
    await expectVisible(page, 'text=Monthly Intent');
    await openAdvancedDashboardPanels(page);
    await expectVisible(page, 'text=Life Arc');
    await assertVisibleAdvanceExists(page, 'dashboard');
    await assertMobileDashboardAdvanceDoesNotCoverVitals(page);
    await assertMobileAdvanceClearsBottomNav(page, 'dashboard');
    await assertMobileDashboardAdvanceDoesNotCoverVitals(page, { width: 360, height: 640 });
    await assertMobileAdvanceClearsBottomNav(page, 'dashboard short Android', { width: 360, height: 640 });

    await page.goto(`${baseUrl}/#/life`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Plan This Month');
    await assertMobileAdvanceClearsBottomNav(page, 'life');
    await assertMobileAdvanceClearsBottomNav(page, 'life short Android', { width: 360, height: 640 });
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });

    await page.getByRole('button', { name: /Advance to/i }).first().click();
    await expectVisible(page, 'text=Turn 1');

    await page.getByRole('button', { name: /Advance to/i }).first().click();
    await expectVisible(page, 'text=First-Home Window Opens');
    await assertMobileScenarioCanScroll(page);
    await page.getByRole('button', { name: /Claim the grant/i }).click();
    await expectVisible(page, 'text=Scenario Resolved');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expectVisible(page, 'text=Home Command Center');
    await expectVisible(page, 'text=This Month');

    await page.goto(`${baseUrl}/#/market`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Market News Feed');
    await expectVisible(page, 'text=Turn 2');

    await page.goto(`${baseUrl}/#/properties`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Best next buy for you');
    await expectVisible(page, 'text=Compare Before You Buy');
    await expectVisible(page, 'text=Suggested set');
    await expectVisible(page, "text=This Month's Market Signals");
    await expectVisible(page, 'text=First-Timer Friendly');
    await page.getByRole('button', { name: /^Compare$/ }).first().click();
    await expectVisible(page, 'text=Your picks');
    await expectVisible(page, 'text=Clear picks');
    await assertMobilePropertiesHeroActionsClearNav(page);
    await page.getByRole('button', { name: 'Review Deal' }).click();
    await expectVisible(page, 'text=Use CPF OA toward eligible upfront costs');
    await page.locator('span').filter({ hasText: 'Cash Required' }).last().waitFor({ state: 'visible', timeout: 15000 });

    const buyButton = page.getByRole('button', { name: 'Buy Property' }).first();
    await page.locator('h1').filter({ hasText: 'Northstar Grove 3-Room' }).waitFor({ state: 'attached', timeout: 15000 });
    await page.setViewportSize({ width: 390, height: 844 });
    await delay(150);
    await assertMobileBuyCtaIsInFlow(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await delay(150);
    const nextMonthOnTransactionPage = await page.getByRole('button', { name: /Next Month/i }).count();
    if (nextMonthOnTransactionPage > 0) {
      throw new Error('Mobile transaction page should not show floating Next Month over the buy CTA.');
    }
    await buyButton.click();
    await page.setViewportSize({ width: 1440, height: 1100 });

    await expectVisible(page, 'text=Portfolio');
    await page.goto(`${baseUrl}/#/portfolio`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Northstar Grove 3-Room');
    await expectVisible(page, 'text=Landlord Ops Command');
    await expectVisible(page, 'img[alt="Landlord operations command dashboard"]');
    await assertMobileRouteHasNoVisibleAdvance(page, 'portfolio');

    await page.goto(`${baseUrl}/#/property/hdb-bto-0`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=First Owner Checklist');
    await expectVisible(page, 'text=Start MOP-Safe Room Rental');
    await expectVisible(page, 'text=Property Operations');
    await expectVisible(page, 'img[alt="Northstar Grove 3-Room floor plan"]');
    await page.getByRole('button', { name: /Owner-Occupied Room/i }).first().click();
    await expectVisible(page, 'text=Active owner-occupied room lease');
    await expectVisible(page, 'text=Lease Decision Board');
    await page.getByRole('button', { name: /Renew Steady/i }).click();
    await expectVisible(page, 'text=Satisfaction 80/100');

    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    for (let step = 0; step < 9; step += 1) {
      await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
      await resolveScenarioIfPresent(page);
      await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
      await clickAdvance(page);
      await resolveScenarioIfPresent(page);
      await delay(200);
    }

    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await resolveScenarioIfPresent(page);
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await clickAdvance(page);
    await expectVisible(page, 'text=Annual Career Review');
    await expectVisible(page, 'img[alt="Career Review"]');
    await page.locator('div.fixed.inset-0 button.group.w-full.text-left:visible:not([disabled])').first().click();
    await expectVisible(page, 'text=Scenario Resolved');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.goto(`${baseUrl}/#/dashboard`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Turn 12');
    await assertManualLoadPromotesAutosave(page);

    await page.goto(`${baseUrl}/#/learn`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Learn Singapore Property Without Prereqs');
    await assertMobileRouteHasNoVisibleAdvance(page, 'learn');

    await browser.close();
    browser = null;
    await stopDevServer(server);
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    await stopDevServer(server);
    throw error;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
