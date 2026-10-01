import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5180/VALTREAK/');
  
  await page.waitForSelector('text=Connect Four');
  
  const CSS = await page.evaluate(() => {
    let styles = '';
    for (let sheet of Array.from(document.styleSheets)) {
      try {
        for (let rule of Array.from(sheet.cssRules)) {
          if (rule.cssText.includes('.border-accent')) {
            styles += rule.cssText + '\n';
          }
        }
      } catch (e) {}
    }
    return styles;
  });
  
  console.log('CSS for border-accent:', CSS);
  
  await browser.close();
})();
