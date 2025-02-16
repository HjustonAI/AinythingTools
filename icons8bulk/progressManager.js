// Language: JavaScript
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'progress.json');

function loadProgress() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  fs.writeFileSync(filePath, JSON.stringify(progress, null, 2));
}

module.exports = { loadProgress, saveProgress };