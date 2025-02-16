const { SELECTORS } = require('./config');
const { waitForKeyPress } = require('./utils');

async function navigateToTarget(page, targetUrl) {
  console.log(`Navigating to ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2' });
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

  return targetUrl;
}

module.exports = { navigateToTarget };