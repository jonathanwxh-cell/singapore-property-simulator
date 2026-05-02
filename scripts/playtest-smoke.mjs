import { spawn } from 'node:child_process';
import net from 'node:net';
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

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
  const child = spawn('cmd.exe', ['/c', 'npm.cmd', 'run', 'dev', '--', '--host', '127.0.0.1', '--strictPort', '--port', String(port)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

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
  await new Promise((resolve) => {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {
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

    await page.getByRole('button', { name: 'How to Play' }).click();
    await expectVisible(page, 'text=How to Play');
    await expectVisible(page, 'text=Quickstart');

    await page.getByRole('button', { name: /Back to Menu/i }).click();
    await expectVisible(page, 'text=New Game');

    await page.getByRole('button', { name: 'New Game' }).click();
    await page.getByPlaceholder('Enter your name...').fill('Codex QA');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: /^Next$/ }).click();
    await page.getByRole('button', { name: /Start Game/i }).click();

    await expectVisible(page, 'text=Market Pulse');
    await expectVisible(page, 'text=Advance to');

    await page.getByRole('button', { name: /Advance to/i }).click();
    await expectVisible(page, 'text=Turn 1');

    await page.getByRole('button', { name: /Advance to/i }).click();
    await expectVisible(page, 'text=First-Home Window Opens');
    await page.getByRole('button', { name: /Claim the grant/i }).click();
    await expectVisible(page, 'text=Scenario Resolved');
    await page.getByRole('button', { name: 'Continue' }).click();

    await page.goto(`${baseUrl}/#/market`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Market News Feed');
    await expectVisible(page, 'text=Turn 2');

    await page.goto(`${baseUrl}/#/properties`, { waitUntil: 'networkidle' });
    await page.getByText('Woodlands North Grove 3-Room').click();
    await expectVisible(page, 'text=Use CPF OA toward eligible upfront costs');
    await expectVisible(page, 'text=Cash Required');

    const buyButton = page.getByRole('button', { name: 'Buy Property' });
    await expectVisible(page, 'text=Woodlands North Grove 3-Room');
    await buyButton.click();

    await expectVisible(page, 'text=Property Browser');
    await page.goto(`${baseUrl}/#/portfolio`, { waitUntil: 'networkidle' });
    await expectVisible(page, 'text=Woodlands North Grove 3-Room');

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
