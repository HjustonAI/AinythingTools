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
        processed: typeof processed === 'number' ? processed : processed.processed,
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
  // Optionally: write backup file and/or allow manual intervention
}
