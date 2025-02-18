const readline = require('readline');
const { DEBUG_MODE } = require('./config');

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function waitForKeyPress(message = 'Press Enter to continue...') {
  if (!DEBUG_MODE) return Promise.resolve();
  console.log(message);
  return new Promise(resolve => {
    const rl = createReadlineInterface();
    rl.question('', () => {
      rl.close();
      resolve();
    });
  });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const randomDelay = (min, max) => {
  const randomPart = Math.floor(Math.random() * (max - min + 1)) + min;
  return delay(randomPart + 50); // Always add an extra 50ms delay.
};

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

module.exports = {
  waitForKeyPress,
  delay,
  randomDelay,
  retryOperation
};