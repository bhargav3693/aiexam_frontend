const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
  
  await page.goto('http://localhost:5174/login');
  await page.fill('input[type="email"]', 'admin@test.com');
  await page.fill('input[type="password"]', 'admin_password');
  await page.click('button[type="submit"]');
  
  await page.waitForTimeout(2000);
  
  // Instead of guessing, try clicking the 3rd button in header -> 'User Activity'
  try {
     const tabs = await page.$$('header button');
     if (tabs.length >= 3) {
        await tabs[2].click();
        console.log('Clicked User Activity header tab');
     }
  } catch(e) { console.log(e.message); }
  
  await page.waitForTimeout(1000);
  
  const viewLogBtns = await page.$$('text=View Log');
  console.log('Found "View Log" buttons:', viewLogBtns.length);
  if (viewLogBtns.length > 0) {
    await viewLogBtns[0].click();
    console.log('Clicked first "View Log" button');
  }
  
  await page.waitForTimeout(2000);
  
  const viewChartsBtns = await page.$$('text=View Charts & Timeline');
  console.log('Found "View Charts & Timeline" buttons:', viewChartsBtns.length);
  if (viewChartsBtns.length > 0) {
    await viewChartsBtns[0].click();
    console.log('Clicked first "View Charts & Timeline" button');
  }
  await page.waitForTimeout(2000);
  
  await browser.close();
})();
