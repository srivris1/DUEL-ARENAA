import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5180/');
  
  // Take screenshot of the match length section
  const section = page.locator('text=Match length').locator('..');
  await section.screenshot({ path: path.join('C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\f488af94-a5bc-4030-ba27-7d32b775d0ed', 'match_length_before.png') });
  
  // Click Best of 5
  await page.locator('button:has-text("Best of 5")').click();
  await page.waitForTimeout(200);
  
  // Take screenshot after click
  await section.screenshot({ path: path.join('C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\f488af94-a5bc-4030-ba27-7d32b775d0ed', 'match_length_after.png') });
  
  await browser.close();
})();
