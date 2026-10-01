import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  
  // Host
  const hostPage = await browser.newPage();
  await hostPage.goto('http://127.0.0.1:5180/VALTREAK/');
  await hostPage.waitForSelector('text/Host Match');
  await hostPage.click('text/Host Match');
  
  // wait for code
  await hostPage.waitForSelector('.text-accent');
  const codeEl = await hostPage.$('.text-accent');
  const code = await hostPage.evaluate(el => el.textContent, codeEl);
  console.log('Room code:', code);
  
  // Guest
  const guestPage = await browser.newPage();
  await guestPage.goto('http://127.0.0.1:5180/VALTREAK/');
  await guestPage.waitForSelector('input[placeholder="ABCDE"]');
  await guestPage.type('input[placeholder="ABCDE"]', code);
  await guestPage.click('text/Join');
  
  // Wait for connection
  await hostPage.waitForSelector('text/joined');
  console.log('Guest connected!');
  
  // Switch to Connect Four as Guest
  await guestPage.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const c4 = buttons.find(b => b.textContent.includes('Connect Four'));
    if (c4) c4.click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Check if Host sees Connect Four
  const hostSeesC4 = await hostPage.evaluate(() => {
    return document.querySelector('[aria-label="Connect four board"]') !== null;
  });
  console.log('Host sees Connect Four?', hostSeesC4);
  
  // Guest plays a dot
  await guestPage.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('[role="gridcell"]'));
    cells[0].click(); // click first column
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Check if Host sees dot
  const hostSeesDot = await hostPage.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('[role="gridcell"]'));
    return cells.some(c => c.innerHTML.includes('p2'));
  });
  console.log('Host sees dot?', hostSeesDot);
  
  await browser.close();
})();
