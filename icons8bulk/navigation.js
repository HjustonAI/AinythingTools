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
    // Optionally: prompt user for retry or save state before continuing
    throw error;
  }
  return targetUrl;
}

module.exports = { navigateToTarget };