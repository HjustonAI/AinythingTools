require('dotenv').config();
const puppeteer = require('puppeteer');
const readline = require('readline');

// Read credentials and configuration from environment variables
const email = process.env.ICON8_EMAIL;
const password = process.env.ICON8_PASSWORD;
const LOGIN_URL = process.env.LOGIN_URL;
const TARGET_URL = process.env.TARGET_URL;
const chromeExecutable = process.env.CHROME_EXECUTABLE_PATH;
const userDataDir = process.env.USER_DATA_DIR;
const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

/**
 * waitForKeyPress: Pauses execution waiting for the user to press Enter if debug mode is enabled.
 * @param {string} message - The custom message shown before waiting.
 */
async function waitForKeyPress(message = 'Press Enter to continue...') {
  if (!DEBUG_MODE) return;
  console.log(message);
  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

// Helper function for a fixed delay (ms)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for a random delay between min and max milliseconds
// Always adds a minimum extra delay (50ms) for improved stability.
const randomDelay = (min, max) => {
  const randomPart = Math.floor(Math.random() * (max - min + 1)) + min;
  const minExtraDelay = 50; // extra delay (ms)
  return delay(randomPart + minExtraDelay);
};

/**
 * Logs in to Icons8 if necessary.
 * @param {object} page - Puppeteer page object.
 */
async function login(page) {
  console.log(`Navigating to login page: ${LOGIN_URL}`);
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await waitForKeyPress('Reached login page. Debug: Press Enter to continue...');

  const emailInput = await page.$('input[placeholder="Email"]');
  if (!emailInput) {
    console.log("Already logged in. Skipping login.");
    return;
  }

  console.log("Login form found. Logging in ...");
  try {
    await page.waitForSelector('input[placeholder="Email"]', { timeout: 10000 });
    await page.waitForSelector('input[placeholder="Password"]', { timeout: 10000 });
  } catch (error) {
    console.error("Error: Login form fields were not found.", error);
    throw error;
  }

  await page.type('input[placeholder="Email"]', email, { delay: 50 });
  await page.type('input[placeholder="Password"]', password, { delay: 50 });
  await waitForKeyPress('Filled credentials. Debug: Press Enter to click login...');

  // Wait for the login button to become enabled.
  await page.waitForFunction(() => {
    const btn = document.querySelector('button.i8-login-form__submit');
    return btn && !btn.hasAttribute('disabled');
  }, { timeout: 10000 });

  console.log("Clicking the login button...");
  await page.click('button.i8-login-form__submit');

  // Wait for navigation to ensure successful login.
  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log("Login successful.");
  } catch (error) {
    console.error("Login may have failed or timed out.", error);
  }
}

/**
 * Navigates the page to the target icons collection.
 * @param {object} page - Puppeteer page object.
 * @returns {string} TARGET_URL used.
 */
async function navigateToTarget(page) {
  console.log(`Navigating to ${TARGET_URL}`);
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });
  await waitForKeyPress('Navigation complete. Debug: Press Enter to check icons presence...');

  try {
    console.log("Waiting for icons to appear...");
    await page.waitForSelector('.app-grid-icon__image', { timeout: 10000 });
  } catch (error) {
    console.error("Error: Icons did not appear on the page in time.", error);
    throw error;
  }

  try {
    console.log("Waiting for icons grid to appear...");
    await page.waitForSelector('.grid-icons', { timeout: 10000 });
  } catch (error) {
    console.error("Error: Icons grid did not appear on the page in time.", error);
    throw error;
  }

  return TARGET_URL;
}

/**
 * Processes all icons on the page.
 * On the first icon, creates a new collection based on header data.
 * @param {object} page - Puppeteer page object.
 */
async function processIcons(page) {
  let icons = await page.$$('.grid-icons .app-grid-icon__image');
  console.log(`Found ${icons.length} icons.`);

  for (let i = 0; i < icons.length; i++) {
    console.log(`Processing icon ${i + 1} of ${icons.length}`);
    try {
      // Click the icon.
      await icons[i].click();
      console.log(`Clicked icon ${i + 1}`);
      await randomDelay(280, 320);
      await waitForKeyPress(`Icon ${i + 1} clicked. Debug: Press Enter after verifying detail view...`);

      try {
        await page.waitForSelector('.app-accordion2__content', { timeout: 10000 });
        console.log(`Detail view loaded for icon ${i + 1}`);
      } catch (error) {
        console.error(`Error: Detail view did not load for icon ${i + 1}`, error);
      }

      // For the first icon, create a new collection using header info.
      if (i === 0) {
        console.log("Initiating creation of a new collection based on header data.");
        const collectionName = await page.$eval('.author-group-header h3', el => el.textContent.trim());
        console.log("Extracted collection name:", collectionName);
        await waitForKeyPress('Debug: Press Enter to continue with creating new collection...');

        try {
          await page.waitForSelector('.accordion-to-collection .i8-dropdown__label', { timeout: 5000 });
          await page.click('.accordion-to-collection .i8-dropdown__label');
          console.log("Clicked 'Add to collection' dropdown.");
        } catch (e) {
          console.error("Add to collection dropdown not found. Check the selector.", e);
        }

        try {
          await page.waitForSelector('.accordion-to-collection .i8-dropdown__content', { timeout: 5000 });
        } catch (e) {
          console.error("Add to collection dropdown content did not open.", e);
        }

        try {
          await page.waitForSelector('.accordion-to-collection .new-collection__button', { timeout: 5000 });
          await page.click('.accordion-to-collection .new-collection__button');
          console.log("Clicked 'New collection' button inside add-to-collection popup.");
        } catch (e) {
          console.error("New collection button inside add-to-collection popup not found.", e);
        }

        // --- Updated new collection creation block ---
        try {
          // Wait for the new collection popup container to appear.
          await page.waitForSelector('div.new-collection__container', { timeout: 5000 });;
          // Now wait for the input element inside the popup.
          await page.waitForSelector('div.new-collection__container input[placeholder="Collection name..."]', { timeout: 5000 });;
          await page.type('div.new-collection__container input[placeholder="Collection name..."]', collectionName, { delay: 100 });;
          console.log("Typed new collection name:", collectionName);
          // Confirm the new collection creation.
          await page.keyboard.press('Enter');
          console.log("Submitted new collection name.");
          await randomDelay(500, 700);
        } catch (e) {
          console.error("Error during new collection creation:", e);
          if (DEBUG_MODE) {
            console.log("Debug Mode: Please open DevTools and verify if the collection name input element is present.");
            await waitForKeyPress("After verifying/fixing the page manually, press Enter to retry...");
            // Attempt again with a longer timeout.
            try {
              await page.waitForSelector('div.new-collection__container', { timeout: 10000 });;
              await page.waitForSelector('div.new-collection__container input[placeholder="Collection name..."]', { timeout: 10000 });;
              await page.type('div.new-collection__container input[placeholder="Collection name..."]', collectionName, { delay: 100 });;
              console.log("Typed new collection name after manual intervention:", collectionName);
              await page.keyboard.press('Enter');
              console.log("Submitted new collection name after manual intervention.");
              await randomDelay(500, 700);
            } catch (retryError) {
              console.error("Retry failed:", retryError);
              throw retryError;
            }
          } else {
            throw e;
          }
        }
      }

      // Send key 'A' to add the icon to the collection.
      await page.focus('body');
      await page.keyboard.press('KeyA');
      console.log(`Sent 'A' key for icon ${i + 1}`);
      await randomDelay(40, 80);
      await randomDelay(180, 220);

      // Close the detail view.
      console.log(`Closing detail view for icon ${i + 1}`);
      await page.keyboard.press('Escape');
      await randomDelay(280, 320);
      await waitForKeyPress(`Icon ${i + 1} processing complete. Debug: Press Enter to continue...`);
    } catch (error) {
      console.error(`Error processing icon ${i + 1}:`, error);
    }

    // Re-fetch the icons in case the DOM has updated.
    icons = await page.$$('.grid-icons .app-grid-icon__image');
  }
}

(async function main() {
  console.log("Launching browser with existing Chrome profile...");
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();

  // Set the viewport to a higher resolution.
  await page.setViewport({ width: 1920, height: 1080 });
  console.log("Viewport set to 1920x1080.");

  try {
    await login(page);
    await navigateToTarget(page);
    await processIcons(page);
  } catch (error) {
    console.error("Automation encountered an error:", error);
  } finally {
    console.log("All icons processed. Closing browser.");
    // Uncomment the next line to close the browser when finished.
    // await browser.close();
  }
})();
