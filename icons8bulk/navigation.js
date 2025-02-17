/* 
This file defines the navigateToTarget function which navigates to a given URL
using Puppeteer. It waits for necessary elements such as icon grid and handles errors
by logging them and rethrowing so that the caller can manage navigation failures.
*/

const { SELECTORS } = require('./config');
const { waitForKeyPress } = require('./utils');

async function navigateToTarget(page, targetUrl) {
  try {
    console.log(`Navigating to ${targetUrl}`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2' });
    await waitForKeyPress('Navigation complete. Debug: Press Enter to check icons presence...');
    
    console.log("Waiting for icons to appear...");
    await page.waitForSelector(SELECTORS.gridIcon, { timeout: 10000 });
    console.log("Waiting for icons grid to appear...");
    await page.waitForSelector(SELECTORS.iconsGrid, { timeout: 15000 });
  } catch (error) {
    console.error("Error during navigation:", error);
    // Optionally update state or prompt user; here we rethrow to be caught by caller.
    throw error;
  }
  return targetUrl;
}

module.exports = { navigateToTarget };