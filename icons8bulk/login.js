const { LOGIN_URL, SELECTORS, email, password } = require('./config');
const { waitForKeyPress } = require('./utils');

async function login(page) {
  console.log(`Navigating to login page: ${LOGIN_URL}`);
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' });
  await waitForKeyPress('Reached login page. Debug: Press Enter to continue...');

  const emailInput = await page.$(SELECTORS.emailInput);
  if (!emailInput) {
    console.log("Already logged in. Skipping login.");
    return;
  }

  console.log("Login form found. Logging in ...");
  try {
    await page.waitForSelector(SELECTORS.emailInput, { timeout: 10000 });
    await page.waitForSelector(SELECTORS.passwordInput, { timeout: 10000 });
  } catch (error) {
    console.error("Error: Login form fields were not found.", error);
    throw error;
  }

  await page.type(SELECTORS.emailInput, email, { delay: 50 });
  await page.type(SELECTORS.passwordInput, password, { delay: 50 });
  await waitForKeyPress('Filled credentials. Debug: Press Enter to click login...');

  await page.waitForFunction(() => {
    const btn = document.querySelector(SELECTORS.loginButton);
    return btn && !btn.hasAttribute('disabled');
  }, { timeout: 10000 });

  console.log("Clicking the login button...");
  await page.click(SELECTORS.loginButton);

  try {
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log("Login successful.");
  } catch (error) {
    console.error("Login may have failed or timed out.", error);
  }
}

module.exports = { login };