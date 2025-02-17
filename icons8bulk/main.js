const config = require('./config');
const puppeteer = require('puppeteer');
const { login } = require('./login');
const { navigateToTarget } = require('./navigation');
const { processIcons } = require('./processIcons');
const { loadProgress } = require('./progressManager');

const { chromeExecutable, userDataDir, DEBUG_MODE, collectionLinks } = config;

(async function main() {
  console.log("=== Icons8 Bulk Collection Processing Tool ===");
  console.log("Starting automation process...");
  console.log(`Found ${collectionLinks.length} collections to process`);
  
  console.log("Launching browser with existing Chrome profile...");
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: chromeExecutable,
    userDataDir: userDataDir,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  console.log("Browser launched and configured successfully");

  try {
    await login(page);
    const progress = loadProgress();
    console.log("Loaded previous progress data");

    for (const targetUrl of collectionLinks) {
      try {
        console.log("\n=== Processing Collection ===");
        console.log(`URL: ${targetUrl}`);
        await navigateToTarget(page, targetUrl);
  
        const savedProgress = progress[targetUrl] || { processed: 0 };
        const startIndex = savedProgress.processed || 0;
        console.log(`Resuming from index: ${startIndex}`);
  
        const result = await processIcons(page, startIndex);
        console.log("Collection processing completed:");
        console.log(`- Processed: ${result.processedCount}/${result.totalIcons} icons`);
        console.log(`- Success: ${result.success ? 'Yes' : 'No'}`);
      } catch (collectionError) {
        console.error(`Error processing collection ${targetUrl}:`, collectionError);
        // Optionally update progress state here before moving to the next URL.
      }
    }

    console.log("\n=== Processing Complete ===");
    console.log(`Processed ${collectionLinks.length} collections`);
  } catch (error) {
    console.error("Fatal error in main:", error);
  } finally {
    console.log("\n=== Cleanup ===");
    console.log("Closing browser...");
    if (!DEBUG_MODE) {
      await browser.close();
      console.log("Browser closed successfully");
    } else {
      console.log("Debug mode: Browser left open");
    }
    console.log("Process finished");
  }
})().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});