/* 
This file contains functions to load and process icons on a collection page.
It scrolls to load icons, triggers detail popups, and adds icons to a collection.
Errors during individual icon processing are caught inside loops and logged,
with progress updates ensuring that failures do not stop the overall process.
*/

const { SELECTORS } = require('./config');
const { waitForKeyPress, randomDelay } = require('./utils');
const { updateProgress } = require('./progressManager');

async function loadAllIcons(page) {
  let prevCount = 0;
  let stableCountCycles = 0;

  while (true) {
    const icons = await page.$$(SELECTORS.gridIcon);
    const currentCount = icons.length;

    if (currentCount > prevCount) {
      // New icons loaded, keep scrolling
      prevCount = currentCount;
      stableCountCycles = 0;
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await randomDelay(400, 600); // wait for next batch
    } else {
      stableCountCycles++;
      if (stableCountCycles > 1) break;
      await randomDelay(400, 600);
    }
  }
  return prevCount;
}

async function triggerCollectionPopup(icons, page) {
  let popupTriggered = false;
  console.log("Attempting to trigger new collection popup using first 3 icons...");

  // Try first 3 icons to trigger the detail popup.
  for (let i = 0; i < Math.min(3, icons.length); i++) {
    try {
      console.log(`Trying icon ${i + 1} for popup trigger.`);
      await icons[i].click();
      await randomDelay(280, 320);
      // Wait for detail view to confirm popup appearance.
      await page.waitForSelector(SELECTORS.detailView, { timeout: 2000 });
      console.log(`Detail view appeared for icon ${i + 1}`);
      popupTriggered = true;
      break;
    } catch (err) {
      console.warn(`Popup not triggered with icon ${i + 1}:`, err);
    }
  }

  // If not automatically triggered, wait for manual intervention.
  if (!popupTriggered) {
    console.log("Popup did not appear after clicking first 3 icons.");
    await waitForKeyPress("Please manually open the popup then press Enter to continue...");
  }
}

async function processIcons(page, startIndex) {
  let processedCount = startIndex;
  let success = true;
  let totalIcons = 0;
  try {
    console.log("Scrolling page to load all icons...");
    totalIcons = await loadAllIcons(page);
    console.log(`Found ${totalIcons} icons.`);

    const icons = await page.$$(SELECTORS.gridIcon);
    if (startIndex === 0) {
      await triggerCollectionPopup(icons, page);

      // Create new collection using the header's data.
      try {
        const collectionName = await page.$eval(
          SELECTORS.headerCollectionName,
          (el) => el.textContent.trim()
        );
        console.log("Extracted collection name:", collectionName);
        await waitForKeyPress("Press Enter to create a new collection...");

        // Open 'Add to collection' dropdown.
        await page.waitForSelector(SELECTORS.addToCollectionLabel, { timeout: 5000 });
        await page.click(SELECTORS.addToCollectionLabel);
        console.log("Clicked 'Add to collection' dropdown.");

        await page.waitForSelector(SELECTORS.addToCollectionContent, { timeout: 5000 });

        // Click 'New collection' button.
        await page.waitForSelector(SELECTORS.newCollectionButton, { timeout: 5000 });
        await page.click(SELECTORS.newCollectionButton);
        console.log("Clicked 'New collection' button.");

        // Fill in new collection form.
        await page.waitForSelector(SELECTORS.newCollectionContainer, { timeout: 5000 });
        await page.waitForSelector(SELECTORS.newCollectionInput, { timeout: 5000 });
        await page.type(SELECTORS.newCollectionInput, collectionName, { delay: 100 });
        console.log("Typed new collection name:", collectionName);
        await page.keyboard.press('Enter');
        console.log("Submitted new collection name.");
        await randomDelay(500, 700);
      } catch (error) {
        console.error("Error during new collection creation:", error);
        // Save state before continuing
        await updateProgress(page.url(), totalIcons, processedCount, false);
      }
    }

    // Process icons with individual try/catch so that one error doesn’t break the loop.
    console.log("Adding all icons to the new collection...");
    for (let i = startIndex; i < icons.length; i++) {
      try {
        await icons[i].click();
        await randomDelay(200, 300);
        await page.focus('body');
        await page.keyboard.press('KeyA');
        await randomDelay(200, 300);
        await page.keyboard.press('Escape');
        await randomDelay(200, 300);
        
        processedCount = i + 1;
        await updateProgress(page.url(), totalIcons, processedCount, true);
      } catch (err) {
        console.error(`Error processing icon ${i + 1}:`, err);
        success = false;
        await updateProgress(page.url(), totalIcons, processedCount, false);
      }
    }
  } catch (error) {
    console.error("Unhandled error in processIcons:", error);
    await updateProgress(page.url(), totalIcons, processedCount, false);
    // Continue working by returning current progress
    return { processedCount, totalIcons, success: false };
  }
  return { processedCount, totalIcons, success };
}

module.exports = { processIcons };