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

// Centralized selectors
const SELECTORS = {
  emailInput: 'input[placeholder="Email"]',
  passwordInput: 'input[placeholder="Password"]',
  loginButton: 'button.i8-login-form__submit',
  gridIcon: '.app-grid-icon__image',
  iconsGrid: '.grid-icons',
  detailView: '.app-accordion2__content',
  addToCollectionLabel: '.accordion-to-collection .i8-dropdown__label',
  addToCollectionContent: '.accordion-to-collection .i8-dropdown__content',
  newCollectionButton: '.accordion-to-collection .new-collection__button',
  newCollectionContainer: 'div.new-collection__container',
  newCollectionInput: 'div.new-collection__container input[placeholder="Collection name..."]',
  headerCollectionName: '.author-group-header h3',
};

// Helper function: wait for user to press Enter if debug mode is enabled.
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

// Helper function for a fixed delay (ms)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function for a random delay between min and max milliseconds
// Always adds a minimum extra delay (50ms) for improved stability.
const randomDelay = (min, max) => {
  const randomPart = Math.floor(Math.random() * (max - min + 1)) + min;
  const minExtraDelay = 50; // extra delay in ms
  return delay(randomPart + minExtraDelay);
};

// Helper function to retry an async operation
async function retryOperation(operation, retries = 3, retryDelay = 1000) {
  let lastError;
  for (let i = 1; i <= retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${i} failed. Retrying in ${retryDelay}ms...`);
      await delay(retryDelay);
    }
  }
  throw lastError;
}

/**
 * Logs in to Icons8 if necessary.
 * @param {object} page - Puppeteer page object.
 */
async function login(page) {
  console.log(`Navigating to login page: ${LOGIN_URL}`);
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await waitForKeyPress('Reached login page. Debug: Press Enter to continue...');

  const emailInput = await page.$(SELECTORS.emailInput);
  if (!emailInput) {
    console.log("Already logged in. Skipping login.");
    return;
  }

  console.log("Login form found. Logging in ...");
  try {
    await page.waitForSelector(SELECTORS.emailInput, { timeout: 10000 });
    await page.waitForSelector(SELECTORS.passwordInput, { timeout: 10000 });
  } catch (error) {
    console.error("Error: Login form fields were not found.", error);
    throw error;
  }

  await page.type(SELECTORS.emailInput, email, { delay: 50 });
  await page.type(SELECTORS.passwordInput, password, { delay: 50 });
  await waitForKeyPress('Filled credentials. Debug: Press Enter to click login...');

  // Wait for the login button to become enabled.
  await page.waitForFunction(() => {
    const btn = document.querySelector(SELECTORS.loginButton);
    return btn && !btn.hasAttribute('disabled');
  }, { timeout: 10000 });

  console.log("Clicking the login button...");
  await page.click(SELECTORS.loginButton);

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
    await page.waitForSelector(SELECTORS.gridIcon, { timeout: 10000 });
  } catch (error) {
    console.error("Error: Icons did not appear on the page in time.", error);
    throw error;
  }

  try {
    console.log("Waiting for icons grid to appear...");
    await page.waitForSelector(SELECTORS.iconsGrid, { timeout: 10000 });
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
  let icons = await page.$$(SELECTORS.gridIcon);
  console.log(`Found ${icons.length} icons.`);

  // Attempt to trigger the popup using first 3 icons
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
      // Ensure clean state if detail view didn't stick
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

  // Create new collection (using the popup that is now open)
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

  // New collection creation with retry logic
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
      // Retry one more time manually
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

  // Now iterate through all icons and send key 'A' to add them to the new collection
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
      // Close the detail view if open
      await page.keyboard.press('Escape');
      await randomDelay(280, 320);
    } catch (err) {
      console.error(`Error processing icon ${i + 1}:`, err);
    }
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
    // Auto-close browser if not in debug mode.
    if (!DEBUG_MODE) {
      await browser.close();
    }
  }
})();
