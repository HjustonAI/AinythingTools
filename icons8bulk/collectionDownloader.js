// Language: JavaScript
const puppeteer = require('puppeteer');
const { login } = require('./login');
const { SELECTORS, chromeExecutable, userDataDir, DEBUG_MODE } = require('./config');
const { waitForKeyPress, randomDelay } = require('./utils');

const COLLECTIONS_URL = 'https://icons8.com/icons/collections';

// New selectors specific to collections page
const COLLECTION_SELECTORS = {
  sidebarList: '#__nuxt > div.app-layouts.has-left-sidebar > div.app-content > div.app-left-sidebar > div.content > div.collection-list.sidebar-collection-list.i8-scroll > div',
  collectionLinks: '#__nuxt > div.app-layouts.has-left-sidebar > div.app-content > div.app-left-sidebar > div.content > div.collection-list.sidebar-collection-list.i8-scroll > div > a'
};

async function getCollectionsList(page) {
  try {
    // Navigate to collections page
    console.log(`Navigating to collections page: ${COLLECTIONS_URL}`);
    await page.goto(COLLECTIONS_URL, { waitUntil: 'networkidle2' });
    await waitForKeyPress('Reached collections page. Press Enter to continue...');

    // Wait for the sidebar with collections to load
    console.log('Waiting for collections sidebar to load...');
    await page.waitForSelector(COLLECTION_SELECTORS.sidebarList, { timeout: 10000 });

    // Extract all collection links
    const collections = await page.$$eval(COLLECTION_SELECTORS.collectionLinks, links => {
      return links.map(link => ({
        name: link.textContent.trim(),
        href: link.getAttribute('href'),
        id: link.getAttribute('href').split('/').pop()
      })).filter(col => 
        // Filter out "Favorites" and "Downloaded" collections
        col.name !== 'Favorites' && col.name !== 'Downloaded'
      );
    });

    console.log('\nFound collections:');
    collections.forEach(col => {
      console.log(`- ${col.name} (${col.id})`);
    });

    return collections;
  } catch (error) {
    console.error('Error getting collections list:', error);
    throw error;
  }
}

async function main() {
  console.log('=== Icons8 Collection Downloader ===');
  
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  try {
    // Login first
    await login(page);
    
    // Get collections list
    const collections = await getCollectionsList(page);
    console.log(`\nTotal collections found: ${collections.length}`);

    // For now, just print the results
    console.log('\nCollection details:');
    collections.forEach((col, index) => {
      console.log(`\n${index + 1}. Collection: ${col.name}`);
      console.log(`   URL: https://icons8.com${col.href}`);
      console.log(`   ID: ${col.id}`);
    });

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

// Run the script
main().catch(console.error);