const config = require('./config');
const puppeteer = require('puppeteer');
const { login } = require('./login');
const { navigateToTarget } = require('./navigation');
const { processIcons } = require('./processIcons');
const { loadProgress, saveProgress } = require('./progressManager');

const { chromeExecutable, userDataDir, DEBUG_MODE, collectionLinks } = config;

(async function main() {
  console.log("Launching browser with existing Chrome profile...");
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  console.log("Viewport set to 1920x1080.");

  try {
    await login(page);
    const progress = loadProgress(); // Load or create an empty progress object

    for (const targetUrl of collectionLinks) {
      console.log(`Processing collection: ${targetUrl}`);
      await navigateToTarget(page, targetUrl);

      // Get the saved start index or default to 0
      const startIndex = progress[targetUrl] || 0;
      console.log(`Resume from icon index: ${startIndex}`);

      // After processing icons, record the last processed index
      const lastProcessed = await processIcons(page, startIndex);
      progress[targetUrl] = lastProcessed;
      saveProgress(progress); // Save the updated progress
    }
  } catch (error) {
    console.error("Automation encountered an error:", error);
  } finally {
    console.log("All icons processed. Closing browser.");
    if (!DEBUG_MODE) {
      await browser.close();
    }
  }
})();