require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Load extracted links from collectionLinks.json if available.
const linksFilePath = path.join(__dirname, 'collectionLinks.json');
let collectionLinks = [];
if (fs.existsSync(linksFilePath)) {
  try {
    collectionLinks = require(linksFilePath);
  } catch (e) {
    console.error('Failed to load collection links:', e);
  }
}

module.exports = {
  // Credentials and URLs
  email: process.env.ICON8_EMAIL,
  password: process.env.ICON8_PASSWORD,
  LOGIN_URL: process.env.LOGIN_URL,
  chromeExecutable: process.env.CHROME_EXECUTABLE_PATH,
  userDataDir: process.env.USER_DATA_DIR,
  DEBUG_MODE: process.env.DEBUG_MODE === 'true',
  
  // Centralized selectors
  SELECTORS: {
    emailInput: 'input[placeholder="Email"]',
    passwordInput: 'input[placeholder="Password"]',
    loginButton: 'button.i8-login-form__submit',
    gridIcon: '.app-grid-icon__image',
    iconsGrid: '.grid-icons',
    detailView: '.app-accordion2__content',
    addToCollectionLabel: '.accordion-to-collection .i8-dropdown__label',
    addToCollectionContent: '.accordion-to-collection .i8-dropdown__content',
    newCollectionButton: '.accordion-to-collection .new-collection__button',
    newCollectionContainer: 'div.new-collection__container',
    newCollectionInput: 'div.new-collection__container input[placeholder="Collection name..."]',
    headerCollectionName: '.author-group-header h3',
  },

  // Use the extracted links for multi-collection processing.
  collectionLinks: collectionLinks
};