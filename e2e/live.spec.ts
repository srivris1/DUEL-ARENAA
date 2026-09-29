import { expect, test } from '@playwright/test';
import type { BrowserContext } from '@playwright/test';

const SIGNAL_HOST = '127.0.0.1';
const SIGNAL_PORT = 9000;
const SIGNAL_PATH = '/duel-arena';
const SIGNAL_KEY = 'duel-arena-key';

async function newGuest(context: BrowserContext) {
  const page = await context.newPage();
  await page.addInitScript(
    (config) => {
      const target = window as unknown as {
        __DUEL_SIGNAL__?: { host: string; port: number; path: string; key: string; secure: boolean };
      };
      target.__DUEL_SIGNAL__ = config;
    },
    { host: SIGNAL_HOST, port: SIGNAL_PORT, path: SIGNAL_PATH, key: SIGNAL_KEY, secure: false },
  );
  return page;
}

test('a room code links two devices and the guest can play a live move', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await newGuest(hostContext);
  const guestPage = await newGuest(guestContext);

  await hostPage.goto('/');
  await hostPage.getByRole('button', { name: /Create room/i }).click();

  const roomLabel = hostPage.getByText(/Room [A-Z0-9]{5}/);
  await expect(roomLabel).toBeVisible();
  const code = (await roomLabel.innerText()).replace(/[^A-Z0-9]/g, '').slice(-5);
  expect(code).toHaveLength(5);

  await guestPage.goto(`/#/join/${code}`);
  await expect(guestPage.getByText(/Connected/i)).toBeVisible({ timeout: 30_000 });
  await expect(hostPage.getByText(/Connected/i)).toBeVisible({ timeout: 30_000 });

  const cell = (page: import('@playwright/test').Page, index: number) =>
    page.getByRole('gridcell').nth(index);

  const hostCell = cell(hostPage, 4);
  await expect(hostCell).toBeEnabled({ timeout: 15_000 });
  await hostCell.click();
  await expect(cell(guestPage, 4)).toHaveAttribute('aria-label', /p1/, { timeout: 15_000 });

  const guestCell = cell(guestPage, 0);
  await expect(guestCell).toBeEnabled({ timeout: 15_000 });
  await guestCell.click();
  await expect(cell(hostPage, 0)).toHaveAttribute('aria-label', /p2/, { timeout: 15_000 });
  await expect(cell(guestPage, 0)).toHaveAttribute('aria-label', /p2/, { timeout: 15_000 });

  await guestPage.getByRole('textbox', { name: 'Message' }).fill('good game');
  await guestPage.getByRole('button', { name: 'Send message' }).click();
  await expect(hostPage.getByText('good game')).toBeVisible({ timeout: 15_000 });

  await hostContext.close();
  await guestContext.close();
});
