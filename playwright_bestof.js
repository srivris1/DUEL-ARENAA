import { test, expect } from '@playwright/test';
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:5180/');
  
  // Wait for the "Best of 5" button
  const btn = page.locator('button:has-text("Best of 5")');
  await btn.waitFor();
  
  const classBefore = await btn.getAttribute('className') || await btn.getAttribute('class');
  console.log('Class before click:', classBefore);
  
  await btn.click();
  
  // Wait for class to change
  await page.waitForTimeout(200);
  
  const classAfter = await btn.getAttribute('className') || await btn.getAttribute('class');
  console.log('Class after click:', classAfter);
  
  await browser.close();
})();
