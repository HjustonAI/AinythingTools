const { SELECTORS } = require('./config');
const { waitForKeyPress, randomDelay } = require('./utils');

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

async function processIcons(page, startIndex) {
  console.log("Scrolling page to load all icons...");
  const totalIcons = await loadAllIcons(page);
  console.log(`Found ${totalIcons} icons.`);

  const icons = await page.$$(SELECTORS.gridIcon);

  // If startIndex is 0, create new collection via the popup.
  if (startIndex === 0) {
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
    }
  }

  // Process (add) remaining icons to the collection.
  console.log("Adding all icons to the new collection...");
  for (let i = startIndex; i < icons.length; i++) {
    try {
      await icons[i].click();
      console.log(`Clicked icon ${i + 1}`);
      await randomDelay(200, 300);

      await page.focus('body');
      await page.keyboard.press('KeyA');
      console.log(`Pressed 'A' for icon ${i + 1}`);
      await randomDelay(200, 300);

      // Close detail view if open.
      await page.keyboard.press('Escape');
      await randomDelay(200, 300);
    } catch (err) {
      console.error(`Error processing icon ${i + 1}:`, err);
      // Optionally, you may want to break or continue based on error conditions.
    }
  }
  return icons.length; // return the last processed index
}

module.exports = { processIcons };