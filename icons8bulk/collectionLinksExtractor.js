// Language: JavaScript
const puppeteer = require('puppeteer');
const { LOGIN_URL, chromeExecutable, userDataDir, DEBUG_MODE } = require('./config');
const readline = require('readline');

// Helper for waiting for key press when DEBUG_MODE is enabled.
async function waitForKeyPress(message = 'Press Enter to continue...') {
  if (!DEBUG_MODE) return;
  console.log(message);
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

// Main function to extract link list from a given collection URL.
async function extractLinks(collectionUrl) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Optionally login if required
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await waitForKeyPress('Reached login page (if needed) then press Enter...');

  // Navigate to the collection page
  console.log(`Navigating to ${collectionUrl}`);
  await page.goto(collectionUrl, { waitUntil: 'networkidle2' });
  await waitForKeyPress('Collection page loaded. Press Enter to extract links...');

  // Wait for the container holding the links to appear.
  await page.waitForSelector('div.pack-grid', { timeout: 10000 });

  // Extract anchor tags within the pack-grid container.
  const links = await page.$$eval('div.pack-grid a', elements =>
    elements.map(el => {
      const href = el.getAttribute('href');
      return href.startsWith('/') ? new URL(href, window.location.origin).href : href;
    })
  );

  console.log('Extracted links:');
  links.forEach(link => console.log(link));
  await browser.close();
}

// Accept the collection URL as a command-line argument.
const collectionUrl = process.argv[2];
if (!collectionUrl) {
  console.error('Please provide a collection URL.');
  process.exit(1);
}

extractLinks(collectionUrl).catch(err => {
  console.error('Error extracting links:', err);
});