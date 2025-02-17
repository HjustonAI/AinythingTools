/* 
This script uses Puppeteer to extract collection links from a target page.
It waits for necessary elements on the page, then writes the links to a JSON file.
Errors occurring during navigation or extraction are caught and logged.
*/
// Language: JavaScript
const puppeteer = require('puppeteer');
const { LOGIN_URL, chromeExecutable, userDataDir, DEBUG_MODE } = require('./config');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

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
(async function extractLinks(collectionUrl) {
  try {
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
    
    // Write the links to a JSON file
    const filePath = path.join(__dirname, 'collectionLinks.json');
    fs.writeFileSync(filePath, JSON.stringify(links, null, 2));
    console.log(`Extracted links written to ${filePath}`);
    
    await browser.close();
  } catch (error) {
    console.error("Error extracting links:", error);
    // Optionally prompt for retry or state saving here.
  }
})(process.argv[2]);