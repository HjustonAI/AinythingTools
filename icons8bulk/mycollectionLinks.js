// Language: JavaScript
const puppeteer = require('puppeteer');
const { login } = require('./login');
const { SELECTORS, chromeExecutable, userDataDir, DEBUG_MODE } = require('./config');
const { waitForKeyPress, randomDelay } = require('./utils');
const fs = require('fs');
const path = require('path');

const COLLECTIONS_URL = 'https://icons8.com/icons/collections';
const OUTPUT_FILE = 'myCollectionLinks.json';

// Selectors specific to collections page
const COLLECTION_SELECTORS = {
  sidebarList: '#__nuxt > div.app-layouts.has-left-sidebar > div.app-content > div.app-left-sidebar > div.content > div.collection-list.sidebar-collection-list.i8-scroll > div',
  collectionLinks: '#__nuxt > div.app-layouts.has-left-sidebar > div.app-content > div.app-left-sidebar > div.content > div.collection-list.sidebar-collection-list.i8-scroll > div > a'
};

async function getCollectionsList(page) {
  try {
    console.log(`Navigating to collections page: ${COLLECTIONS_URL}`);
    await page.goto(COLLECTIONS_URL, { waitUntil: 'networkidle2' });
    await waitForKeyPress('Reached collections page. Press Enter to continue...');

    console.log('Waiting for collections sidebar to load...');
    await page.waitForSelector(COLLECTION_SELECTORS.sidebarList, { timeout: 10000 });

    const collections = await page.$$eval(COLLECTION_SELECTORS.collectionLinks, links => {
      return links.map(link => ({
        name: link.textContent.trim(),
        url: `https://icons8.com${link.getAttribute('href')}`,
        id: link.getAttribute('href').split('/').pop()
      })).filter(col => 
        col.name !== 'Favorites0' && 
        col.name !== 'Downloaded0'
      );
    });

    return collections;
  } catch (error) {
    console.error('Error getting collections list:', error);
    throw error;
  }
}

async function saveCollections(collections) {
  const filePath = path.join(__dirname, OUTPUT_FILE);
  try {
    fs.writeFileSync(filePath, JSON.stringify(collections, null, 2));
    console.log(`\nCollection links saved to: ${filePath}`);
  } catch (error) {
    console.error('Error saving collections to file:', error);
    throw error;
  }
}

(async function main() {
  console.log('=== Icons8 Collection Link Extractor ===');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    await login(page);
    
    const collections = await getCollectionsList(page);
    console.log(`\nFound ${collections.length} collections:`);
    
    collections.forEach((col, index) => {
      console.log(`\n${index + 1}. ${col.name}`);
      console.log(`   URL: ${col.url}`);
      console.log(`   ID: ${col.id}`);
    });

    await saveCollections(collections);

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
})().catch(console.error);