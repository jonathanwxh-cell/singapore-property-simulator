import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import { createDevServerCommand, createWindowsKillCommand } from './playtest-platform.mjs';

export async function withPlayPage(test, viewport = { width: 390, height: 844 }) {
  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = startDevServer(port);
  let browser;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport });
    await test(page, baseUrl);
  } finally {
    if (browser) await browser.close();
    await stopDevServer(server);
  }
}

export async function gotoRoute(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('body', { state: 'attached' });
  await delay(200);
}

export async function expectVisible(page, selector, timeout = 15000) {
  await page.waitForSelector(selector, { timeout });
}

export async function clickCompactNav(page, label) {
  const buttons = page.locator('button');
  const count = await buttons.count();
  for (let i = 0; i < count; i += 1) {
    const button = buttons.nth(i);
    if (!(await button.isVisible())) continue;
    const text = normalize(await button.innerText());
    if (text === label || text.endsWith(` ${label}`)) {
      await button.click();
      return;
    }
  }
  throw new Error(`Could not find compact nav button: ${label}`);
}

export async function startQuickGame(page, baseUrl) {
  await gotoRoute(page, `${baseUrl}/#/`);
  await page.getByRole('button', { name: /quick start/i }).click();
  await expectVisible(page, 'text=This month');
  await expectVisible(page, 'text=Find your first home');
  await expectVisible(page, 'text=Next Month');
}

export async function startConfiguredGame(page, baseUrl, {
  name,
  householdLabel,
  residencyLabel,
}) {
  await gotoRoute(page, `${baseUrl}/#/new`);
  await page.locator('input').first().fill(name);

  if (householdLabel) {
    await page.locator('button').filter({ hasText: householdLabel }).first().click();
    await delay(100);
  }

  if (residencyLabel) {
    await page.locator('button').filter({ hasText: residencyLabel }).first().click();
    await delay(100);
  }

  await page.getByRole('button', { name: /Begin/i }).click();
  await expectVisible(page, 'text=This month');
  await expectVisible(page, 'text=Next Month');
}

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

function normalize(value) {
  return value.replace(/\s+/g, ' ').trim();
}
