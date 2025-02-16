require('dotenv').config();

module.exports = {
  // Credentials and URLs
  email: process.env.ICON8_EMAIL,
  password: process.env.ICON8_PASSWORD,
  LOGIN_URL: process.env.LOGIN_URL,
  // TARGET_URL is no longer used as a collection link.
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

  // Collection links to iterate over for multi-collection processing.
  collectionLinks: [
    'https://icons8.com/icons/authors/PzU2NC6c2Jl9/microdot-graphic/external-microdots-premium-microdot-graphic/external-human-civilization-vol1-microdots-premium-microdot-graphic',
    'https://icons8.com/icons/authors/PzU2NC6c2Jl9/microdot-graphic/external-microdots-premium-microdot-graphic/external-business-finance-vol3-microdots-premium-microdot-graphic',
    'https://icons8.com/icons/authors/PzU2NC6c2Jl9/microdot-graphic/external-microdots-premium-microdot-graphic/external-appliance-electronic-vol1-microdots-premium-microdot-graphic'
  ]
};