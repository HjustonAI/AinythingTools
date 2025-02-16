# AinythingTools

A collection of automation tools for productivity and content management.

## Tools Overview

### 1. Icons8 Bulk Collection Manager
Automates the process of creating and managing icon collections on Icons8.com.

### 2. JSON to Google Slides
Converts JSON data into formatted Google Slides presentations.

## Installation

### Prerequisites
- Node.js 14+ (for Icons8 tool)
- Python 3.x (for JSON2Slides tool)
- Google Chrome browser
- Google Cloud project with Slides and Drive APIs enabled
- Icons8.com account (for Icons8 tool)

### Setup Icons8 Bulk Collection Manager

1. Navigate to the icons8bulk directory:
```bash
cd icons8bulk
```
2. Install dependencies:
```bash
npm install
```
3. Configure environment variables by creating .env file:
```
ICON8_EMAIL=your.email@example.com
ICON8_PASSWORD=your_password
LOGIN_URL=https://icons8.com/login
CHROME_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
USER_DATA_DIR=C:\Users\YourUsername\AppData\Local\Google\Chrome\User Data\Default
DEBUG_MODE=false
```

### Setup JSON to Google Slides

1. Navigate to the json2slides directory:
```bash
cd json2slides
```
2. Install Python dependencies:
```bash
pip install -r requirements.txt
```
3. Place your credentials.json (OAuth 2.0) in the project root
4. Configure presentation settings in config.json

## Usage

### Icons8 Bulk Collection Manager

#### Extract Collection Links
1. Find the main collection page URL on Icons8
2. Run the extractor:
```bash
node collectionLinksExtractor.js "https://icons8.com/your-collection-url"
```

#### Create Collections
1. After extracting links, run:
```bash
node main.js
```

Features:
- Automatic login handling
- Progress tracking (resumes from last position)
- Debug mode for troubleshooting
- Configurable delays and retries
- Chrome profile integration

### JSON to Google Slides

1. Prepare your slide content in JSON format:
```
[
  {
    "title": "Slide Title",
    "content": ["Point 1", "Point 2"],
    "notes": "Speaker notes here"
  }
]
```
2. Run the converter:
```bash
python json2slides.py
```

Features:
- Custom slide layouts
- Speaker notes support
- Google Drive integration
- Batch processing
- Progress tracking

## Project Structure

```
AinythingTools/
├── icons8bulk/           # Icons8 automation tool
│   ├── config.js         # Configuration and selectors
│   ├── main.js           # Main execution script
│   ├── login.js          # Authentication handler
│   ├── navigation.js     # Page navigation
│   ├── processIcons.js   # Icon processing logic
│   └── utils.js          # Helper functions
│
└── json2slides/          # Slides conversion tool
    ├── json2slides.py    # Main converter script
    └── slides/           # Slide templates and assets
```

## Configuration

### Icons8 Tool
- .env: Environment variables and credentials
- config.js: Selectors and runtime settings
- progress.json: Automation progress tracking
- collectionLinks.json: Target collection URLs

### JSON2Slides Tool
- config.json: Presentation settings
- credentials.json: Google OAuth credentials
- token.json: Authentication tokens

## Troubleshooting

### Icons8 Tool
- Enable DEBUG_MODE in .env for step-by-step execution
- Check Chrome profile path in .env
- Verify network connectivity
- Ensure valid Icons8 credentials

### JSON2Slides Tool
- Verify Google API credentials
- Check JSON syntax in slide data
- Enable verbose logging if needed
- Confirm API permissions

## Contributing
- Fork the repository
- Create a feature branch
- Commit your changes
- Push to the branch
- Create a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- Icons8.com for their icon platform
- Google Slides API documentation
- Puppeteer team for browser automation
- Python Google API client library

## Support
For issues and feature requests, please use the GitHub issue tracker.

## Roadmap
- [ ] Add batch processing for multiple collections
- [ ] Implement retry mechanisms for failed operations
- [ ] Add support for custom slide templates
- [ ] Improve error handling and reporting
- [ ] Add CLI interface for both tools