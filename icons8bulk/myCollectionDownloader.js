/*
This script automates the downloading of Icons8 collections.
For each collection in myCollectionLinks.json, it:
1. Navigates to the collection page
2. Clicks the download button
3. Handles the download modal
4. Waits for the download to start
5. Closes the modal
Features:
- Progress tracking
- Error handling
- Configurable delays
- Debug mode support
Dependencies: Requires login.js, config.js, and utils.js
*/
const puppeteer = require('puppeteer');
const { login } = require('./login');
const { SELECTORS, chromeExecutable, userDataDir, DEBUG_MODE } = require('./config');
const { waitForKeyPress, randomDelay } = require('./utils');
const fs = require('fs');
const path = require('path');

const DOWNLOAD_SELECTORS = {
  downloadButton: '#__nuxt > div.app-layouts.has-left-sidebar > div.app-content > div.app-page.i8-scroll > div.collection-page > div > div > div.hero-gradient.hero-collection > div.hero-collection__body > div.collection-controls.hero-collection__controls > div:nth-child(1) > button',
  modalWindow: 'body > div.app-modal-download > div.i8-modal',
  modalDownloadButton: 'body > div.app-modal-download > div.i8-modal > div > div > div.app-modal-footer.app-modal-download__footer > div > div > button',
  modalCloseButton: 'body > div.app-modal-download > div.i8-modal > button'
};

async function downloadCollection(page, collection) {
  console.log(`\nProcessing collection: ${collection.name}`);
  
  try {
    // Navigate to collection page
    await page.goto(collection.url, { waitUntil: 'networkidle2' });
    await randomDelay(1000, 2000);

    // Click the download button
    await page.waitForSelector(DOWNLOAD_SELECTORS.downloadButton);
    await page.click(DOWNLOAD_SELECTORS.downloadButton);
    console.log('Clicked download button');
    await randomDelay(1000, 2000);

    // Wait for modal and click download
    await page.waitForSelector(DOWNLOAD_SELECTORS.modalWindow);
    await page.waitForSelector(DOWNLOAD_SELECTORS.modalDownloadButton);
    await page.click(DOWNLOAD_SELECTORS.modalDownloadButton);
    console.log('Clicked modal download button');

    // Instead of waiting for a download event, wait a fixed time 
    // to allow the OS Save As dialog/download process to begin
    console.log('Waiting for download to complete...');
    await randomDelay(5000, 7000);

    // Suggestion: Investigate if download events can be captured rather than using fixed delays.

    // Close the modal after download starts
    await page.waitForSelector(DOWNLOAD_SELECTORS.modalCloseButton);
    await page.click(DOWNLOAD_SELECTORS.modalCloseButton);
    console.log('Closed download modal');
    
    await randomDelay(2000, 3000); // Wait between collections
    return true;
  } catch (error) {
    console.error(`Error downloading collection ${collection.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('=== Icons8 Collection Downloader ===');
  
  // Load collection links
  const collectionsPath = path.join(__dirname, 'myCollectionLinks.json');
  if (!fs.existsSync(collectionsPath)) {
    console.error('myCollectionLinks.json not found. Please run mycollectionLinks.js first.');
    return;
  }

  const collections = JSON.parse(fs.readFileSync(collectionsPath, 'utf8'));
  console.log(`Loaded ${collections.length} collections to process`);

  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await login(page);
    
    let successful = 0;
    let failed = 0;

    for (const collection of collections) {
      const success = await downloadCollection(page, collection);
      if (success) {
        successful++;
      } else {
        failed++;
      }
      
      console.log(`Progress: ${successful + failed}/${collections.length} (${successful} successful, ${failed} failed)`);
    }

    console.log('\nDownload Summary:');
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Successful Downloads: ${successful}`);
    console.log(`Failed Downloads: ${failed}`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    if (!DEBUG_MODE) {
      await browser.close();
      console.log('\nBrowser closed.');
    } else {
      console.log('\nDebug mode: Browser left open.');
    }
  }
}

main().catch(console.error);