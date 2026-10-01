import { test, expect } from '@playwright/test';

test('connect four multiplayer', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  // Host creates room
  await hostPage.goto('http://127.0.0.1:5180/VALTREAK/');
  await hostPage.click('text=Host Match');
  await expect(hostPage.locator('text=Waiting for opponent')).toBeVisible();

  // Get room code
  const codeElement = await hostPage.locator('.text-accent').first();
  const roomCode = await codeElement.textContent();
  console.log('Room code:', roomCode);

  // Guest joins room
  await guestPage.goto('http://127.0.0.1:5180/VALTREAK/');
  await guestPage.click('text=Join Match');
  await guestPage.fill('input', roomCode!.trim());
  await guestPage.click('text=Join');

  // Wait for connection
  await expect(hostPage.locator('text=Player 2 joined')).toBeVisible();

  // Host switches to Connect Four
  await hostPage.click('button:has-text("Connect Four")');

  // Both should see Connect Four
  await expect(hostPage.locator('[aria-label="Connect four board"]')).toBeVisible();
  await expect(guestPage.locator('[aria-label="Connect four board"]')).toBeVisible();

  // Host plays in column 1 (index 0)
  await hostPage.click('[aria-label="Drop into column 1"]');
  // Check that gridcell updated for both
  await expect(hostPage.locator('[aria-label="Column 1, row 1: p1"]')).toBeVisible();
  await expect(guestPage.locator('[aria-label="Column 1, row 1: p1"]')).toBeVisible();

  // Guest plays in column 2 (index 1)
  await guestPage.click('[aria-label="Drop into column 2"]');
  await expect(hostPage.locator('[aria-label="Column 2, row 1: p2"]')).toBeVisible();
  await expect(guestPage.locator('[aria-label="Column 2, row 1: p2"]')).toBeVisible();

  console.log('Successfully played moves in multiplayer Connect Four!');
});
