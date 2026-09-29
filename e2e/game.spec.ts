import { expect, test } from '@playwright/test';

test('lobby offers all three games', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Duel Arena' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Tic-Tac-Toe/i })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Connect Four/i })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Rock Paper Scissors/i })).toBeVisible();
});

test('two players can play a full pass and play round', async ({ page }) => {
  await page.goto('/#/local');
  await expect(page.getByRole('grid', { name: 'Tic tac toe board' })).toBeVisible();

  const cell = (index: number) =>
    page.getByRole('gridcell', {
      name: `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}: empty`,
    });

  for (const index of [0, 4, 1, 5, 2]) {
    await cell(index).click();
  }

  await expect(page.getByText(/takes round 1/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /Next round/i })).toBeVisible();
});

test('creating a room shows a shareable code', async ({ page }) => {
  await page.addInitScript((config) => {
    const target = window as unknown as {
      __DUEL_SIGNAL__?: { host: string; port: number; path: string; key: string; secure: boolean };
    };
    target.__DUEL_SIGNAL__ = config;
  }, { host: '127.0.0.1', port: 9000, path: '/duel-arena', key: 'duel-arena-key', secure: false });
  await page.goto('/');
  await page.getByRole('button', { name: /Create room/i }).click();
  await expect(page.getByText(/Room [A-Z0-9]{5}/)).toBeVisible();
  await expect(page.getByText(/Waiting for opponent/i)).toBeVisible({ timeout: 20000 });
});

test('switching to rock paper scissors renders the throw arena', async ({ page }) => {
  await page.goto('/#/local');
  await page.getByRole('radio', { name: /Rock Paper Scissors/i }).click();
  await expect(page.getByRole('button', { name: 'Throw Rock' })).toBeVisible();
  await page.getByRole('button', { name: 'Throw Rock' }).click();
  await expect(page.getByText(/locked in/i)).toBeVisible();
});

test('the message box stays usable on a phone screen', async ({ page }) => {
  await page.goto('/#/local');
  await expect(page.getByRole('grid')).toBeVisible();
  const input = page.getByRole('textbox', { name: 'Message' });
  const box = await input.boundingBox();
  expect(box?.width ?? 0).toBeGreaterThan(200);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);

  const emote = page.getByRole('button', { name: 'Send 🔥' });
  const emoteBox = await emote.boundingBox();
  expect(emoteBox?.height ?? 0).toBeGreaterThanOrEqual(44);

  await input.fill('gg');
  await input.press('Enter');
  await expect(page.getByText('gg')).toBeVisible();
});

test('the game chosen in the lobby carries into the match', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Connect Four/i }).click();
  await page.getByRole('button', { name: /Pass & play/i }).click();
  await expect(page.getByRole('grid', { name: 'Connect four board' })).toBeVisible();
  await page.getByRole('button', { name: 'Drop into column 4' }).click();
  await expect(page.getByRole('gridcell', { name: /Column 4, row 6: p1/ })).toBeVisible();
});
