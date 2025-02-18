/* 
This script converts the old progress JSON file into a new format by mapping
each collection's progress with a timestamp. The conversion is wrapped in a try/catch,
logging errors in case of file read/write failures.
*/
const fs = require('fs');
const path = require('path');

try {
  const progressPath = path.join(__dirname, 'progress.json');
  const oldProgress = require(progressPath);
  const baseTime = new Date('2023-12-20T10:00:00.000Z');

  const newProgress = Object.fromEntries(
    Object.entries(oldProgress).map(([url, processed], index) => {
      const timestamp = new Date(baseTime.getTime() + index * 15 * 60000);
      return [url, {
        processed: typeof processed === 'number' ? processed : (typeof processed.processed === 'number' ? processed.processed : 0),
        total: 100,
        success: processed === 100,
        lastAttempt: timestamp.toISOString()
      }];
    })
  );

  fs.writeFileSync(progressPath, JSON.stringify(newProgress, null, 2));
  console.log('Progress file converted successfully!');
} catch (error) {
  console.error("Error converting progress file:", error);
  // Optionally create a backup file here
}
