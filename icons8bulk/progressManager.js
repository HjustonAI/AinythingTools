const fs = require('fs');
const path = require('path');

const PROGRESS_FILE = path.join(__dirname, 'progress.json');

// Validate progress data structure
function isValidProgress(data) {
  return typeof data === 'object' && 
         Object.entries(data).every(([key, value]) => 
           typeof key === 'string' && 
           typeof value === 'object' &&
           'processed' in value &&
           'total' in value &&
           'lastAttempt' in value &&
           'success' in value
         );
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      console.log("Loading existing progress data...");
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
      console.log(`Found progress data for ${Object.keys(data).length} collections`);
      if (isValidProgress(data)) return data;
    }
  } catch (error) {
    console.error("Error loading progress file:", error);
  }
  console.log("Creating new progress tracking file");
  return {};
}

function saveProgress(progress) {
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    console.log("Progress saved successfully");
  } catch (error) {
    console.error("Error saving progress:", error);
  }
}

async function updateProgress(url, total, processed, success = true) {
  const progress = loadProgress();
  progress[url] = {
    processed,
    total,
    success,
    lastAttempt: new Date().toISOString()
  };
  saveProgress(progress);
  console.log(`Progress updated - ${processed}/${total} icons processed`);
}

module.exports = { loadProgress, saveProgress, updateProgress };