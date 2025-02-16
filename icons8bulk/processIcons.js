const { SELECTORS, DEBUG_MODE } = require('./config');
const { waitForKeyPress, randomDelay, retryOperation } = require('./utils');

async function processIcons(page) {
  let icons = await page.$$(SELECTORS.gridIcon);
  console.log(`Found ${icons.length} icons.`);

  // Attempt to trigger the popup using first 3 icons.
  let popupTriggered = false;
  for (let i = 0; i < Math.min(3, icons.length); i++) {
    try {
      console.log(`Trying icon ${i + 1} to trigger popup.`);
      await icons[i].click();
      await randomDelay(280, 320);
      try {
        await page.waitForSelector(SELECTORS.detailView, { timeout: 2000 });
        console.log(`Detail view appeared for icon ${i + 1}`);
        popupTriggered = true;
        break;
      } catch (err) {
        console.warn(`No detail view for icon ${i + 1}.`);
      }
      await page.keyboard.press('Escape');
      await randomDelay(200, 300);
    } catch (clickErr) {
      console.error(`Error while trying icon ${i + 1}:`, clickErr);
    }
  }

  if (!popupTriggered) {
    console.log("Popup did not appear after clicking first 3 icons. Waiting for manual intervention...");
    await waitForKeyPress("Please manually open the popup then press Enter to continue...");
  }

  // Create new collection using the open popup.
  console.log("Initiating creation of a new collection based on header data.");
  const collectionName = await page.$eval(SELECTORS.headerCollectionName, el => el.textContent.trim());
  console.log("Extracted collection name:", collectionName);
  await waitForKeyPress('Debug: Press Enter to continue with new collection creation...');

  try {
    await page.waitForSelector(SELECTORS.addToCollectionLabel, { timeout: 5000 });
    await page.click(SELECTORS.addToCollectionLabel);
    console.log("Clicked 'Add to collection' dropdown.");
  } catch (e) {
    console.error("Add to collection dropdown not found. Check the selector.", e);
  }

  try {
    await page.waitForSelector(SELECTORS.addToCollectionContent, { timeout: 5000 });
  } catch (e) {
    console.error("Add to collection dropdown content did not open.", e);
  }

  try {
    await page.waitForSelector(SELECTORS.newCollectionButton, { timeout: 5000 });
    await page.click(SELECTORS.newCollectionButton);
    console.log("Clicked 'New collection' button inside add-to-collection popup.");
  } catch (e) {
    console.error("New collection button inside add-to-collection popup not found.", e);
  }

  await retryOperation(async () => {
    await page.waitForSelector(SELECTORS.newCollectionContainer, { timeout: 5000 });
    await page.waitForSelector(SELECTORS.newCollectionInput, { timeout: 5000 });
    await page.type(SELECTORS.newCollectionInput, collectionName, { delay: 100 });
    console.log("Typed new collection name:", collectionName);
    await page.keyboard.press('Enter');
    console.log("Submitted new collection name.");
    await randomDelay(500, 700);
  }, DEBUG_MODE ? 1 : 3).catch(async error => {
    console.error("Error during new collection creation:", error);
    if (DEBUG_MODE) {
      console.log("Debug Mode: Please open DevTools and verify if the collection name input element is present.");
      await waitForKeyPress("After verifying/fixing the page manually, press Enter to retry...");
      await retryOperation(async () => {
        await page.waitForSelector(SELECTORS.newCollectionContainer, { timeout: 10000 });
        await page.waitForSelector(SELECTORS.newCollectionInput, { timeout: 10000 });
        await page.type(SELECTORS.newCollectionInput, collectionName, { delay: 100 });
        console.log("Typed new collection name after manual intervention:", collectionName);
        await page.keyboard.press('Enter');
        console.log("Submitted new collection name after manual intervention.");
        await randomDelay(500, 700);
      }, 1);
    } else {
      throw error;
    }
  });

  console.log("Adding all icons to the new collection...");
  for (let i = 0; i < icons.length; i++) {
    try {
      await icons[i].click();
      console.log(`Clicked icon ${i + 1} for adding to collection.`);
      await randomDelay(280, 320);
      await page.focus('body');
      await page.keyboard.press('KeyA');
      console.log(`Sent 'A' key for icon ${i + 1}`);
      await randomDelay(40, 80);
      await randomDelay(180, 220);
      await page.keyboard.press('Escape');
      await randomDelay(280, 320);
    } catch (err) {
      console.error(`Error processing icon ${i + 1}:`, err);
    }
  }
}

module.exports = { processIcons };