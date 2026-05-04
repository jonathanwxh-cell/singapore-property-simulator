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

async function startDefaultGame(page, baseUrl) {
  await page.goto(`${baseUrl}/#/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'New Game' }).click();
  await page.getByPlaceholder('Enter your name...').fill('Scroll QA');
  await page.getByRole('button', { name: 'Next' }).click();
  await expectVisible(page, 'text=Choose Your Career');
  await page.getByRole('button', { name: /^Next$/ }).click();
  await expectVisible(page, 'text=Choose Buyer Profile');
  await page.getByRole('button', { name: /^Next$/ }).click();
  await page.getByRole('button', { name: /Start Game/i }).click();
  await expectVisible(page, 'text=First-Home Mission Rail');
}

async function run() {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startDevServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    await startDefaultGame(page, baseUrl);

    await page.goto(`${baseUrl}/#/property/hdb-bto-0`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Property Details');
    const main = page.locator('main');
    await main.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    const scrolledBeforeNavigation = await main.evaluate((element) => element.scrollTop);
    if (scrolledBeforeNavigation < 200) {
      throw new Error(`Setup failed: expected the property page to scroll deeply, got ${scrolledBeforeNavigation}.`);
    }

    await page.getByRole('button', { name: /^Market$/ }).click();
    await expectVisible(page, 'text=Market News Feed');
    await delay(100);
    const afterNavigation = await main.evaluate((element) => element.scrollTop);
    if (afterNavigation !== 0) {
      throw new Error(`Expected route navigation to reset main scroll to 0, got ${afterNavigation}.`);
    }

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
