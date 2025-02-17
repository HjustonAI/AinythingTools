// Language: JavaScript
const puppeteer = require('puppeteer');
const { login } = require('./login');
const { SELECTORS, chromeExecutable, userDataDir, DEBUG_MODE } = require('./config');
const { waitForKeyPress, randomDelay } = require('./utils');
const fs = require('fs');
const path = require('path');

// Selectors specific to the deletion process
const DELETE_SELECTORS = {
  deleteButton: '#__nuxt > div.app-layouts.has-left-sidebar > div.app-content > div.app-page.i8-scroll > div.collection-page > div > div > div.hero-gradient.hero-collection > div > div.collection-controls.hero-collection__controls > div.i8-tooltip.delete-control > div.i8-tooltip__target > button',
  snackbarText: 'div > div > div.snackbar__text'
};

async function deleteCollection(page, collection) {
  console.log(`\nProcessing deletion for collection: ${collection.name}`);
  
  try {
    // Navigate to the collection page
    await page.goto(collection.url, { waitUntil: 'networkidle2' });
    await randomDelay(1000, 2000);
    
    // Wait for and click the delete button
    await page.waitForSelector(DELETE_SELECTORS.deleteButton, { timeout: 10000 });
    await page.click(DELETE_SELECTORS.deleteButton);
    console.log(`Clicked delete button for collection: ${collection.name}`);
    
    // Wait for the snackbar confirmation message to appear
    await page.waitForSelector(DELETE_SELECTORS.snackbarText, { timeout: 10000 });
    console.log('Deletion confirmation message appeared.');
    
    // Wait for the snackbar message to disappear
    await page.waitForFunction(
      selector => !document.querySelector(selector),
      {},
      DELETE_SELECTORS.snackbarText
    );
    console.log('Deletion confirmation message disappeared.');
    
    await randomDelay(2000, 3000); // Pause before processing the next collection
    return true;
  } catch (error) {
    console.error(`Error deleting collection ${collection.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('=== Icons8 Collection Eraser ===');
  
  // Load collection links from myCollectionLinks.json
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
      const success = await deleteCollection(page, collection);
      if (success) {
        successful++;
      } else {
        failed++;
      }
      
      console.log(`Progress: ${successful + failed}/${collections.length} (${successful} successful, ${failed} failed)`);
    }
    
    console.log('\nDeletion Summary:');
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Successful Deletions: ${successful}`);
    console.log(`Failed Deletions: ${failed}`);
    
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