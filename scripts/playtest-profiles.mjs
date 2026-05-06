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

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));

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

async function startProfile(page, baseUrl, {
  name,
  householdLabel,
  residencyLabel,
}) {
  await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'New Game' }).click();
  await expectVisible(page, 'text=Enter Your Name');
  await page.getByPlaceholder('Enter your name...').fill(name);
  await delay(150);
  await page.getByRole('button', { name: 'Customize Run' }).click();
  await expectVisible(page, 'text=Choose Your Career');
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expectVisible(page, 'text=Choose Buyer Profile');
  if (householdLabel) {
    await page.getByRole('button', { name: new RegExp(householdLabel, 'i') }).click();
    await delay(150);
  }
  if (residencyLabel) {
    const residencyButton = page.locator('button').filter({ hasText: getResidencyRateText(residencyLabel) });
    await residencyButton.click();
    await delay(150);
  }
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expectVisible(page, 'text=Choose Your Life Arc');
  const routeLabel = getRouteLabel(householdLabel, residencyLabel);
  if (routeLabel) {
    await page.getByRole('button', { name: new RegExp(routeLabel, 'i') }).click();
    await delay(150);
  }
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expectVisible(page, 'text=Select Difficulty');
  await page.getByRole('button', { name: /Start Game/i }).click();
  await expectVisible(page, 'text=Home Command Center');
  await expectVisible(page, 'text=Beginner focus mode');
  await expectVisible(page, 'text=Monthly Intent');
}

function getResidencyRateText(residencyLabel) {
  if (/foreigner/i.test(residencyLabel)) return '60% ABSD';
  if (/pr/i.test(residencyLabel)) return '5% first-home ABSD';
  return '0% first-home ABSD';
}

function getRouteLabel(householdLabel, residencyLabel) {
  if (/foreigner/i.test(residencyLabel)) return 'Foreign Investor';
  if (/pr/i.test(residencyLabel)) return 'PR Private-Market Climber';
  if (/single 35/i.test(householdLabel ?? '')) return 'Single 35 Resale Buyer';
  return 'BTO-to-Condo Upgrader';
}

async function run() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startDevServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 1000 } });

    await startProfile(page, baseUrl, {
      name: 'SC Family QA',
      householdLabel: 'Couple / Family',
      residencyLabel: 'Singapore Citizen',
    });
    await expectVisible(page, 'text=Beginner focus mode');
    await page.goto(`${baseUrl}/#/property/hdb-bto-0`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=First-Timer Friendly');
    await expectVisible(page, 'text=Use CPF OA toward eligible upfront costs');

    await startProfile(page, baseUrl, {
      name: 'Young Single QA',
      householdLabel: 'Single Under 35',
      residencyLabel: 'Singapore Citizen',
    });
    await page.goto(`${baseUrl}/#/property/hdb-bto-0`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Single buyers under 35 cannot use the solo HDB path yet');
    await expectVisible(page, 'text=wait until 35');

    await startProfile(page, baseUrl, {
      name: 'Foreigner QA',
      householdLabel: 'Foreign Investor',
      residencyLabel: 'Foreigner',
    });
    await page.goto(`${baseUrl}/#/property/hdb-bto-0`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Foreigners cannot buy HDB flats or executive condos');
    await page.goto(`${baseUrl}/#/property/condo-4`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=ABSD 60%');

    await startProfile(page, baseUrl, {
      name: 'PR QA',
      householdLabel: 'Couple / Family',
      residencyLabel: 'Singapore PR',
    });
    await page.goto(`${baseUrl}/#/property/hdb-bto-0`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=SPR households cannot buy new HDB BTO flats');
    await page.goto(`${baseUrl}/#/property/condo-4`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=ABSD 5%');

    await browser.close();
    browser = null;
    await stopDevServer(server);
  } catch (error) {
    if (browser) await browser.close();
    await stopDevServer(server);
    throw error;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
