# JSON to Google Slides

This script converts a JSON file into Google Slides using the Google Slides API. It reads slide data (title, content, and notes) from a JSON, then generates a new presentation with optional notes.

## Prerequisites
- Python 3.x  
- A Google Cloud project with Slides API and Drive API enabled  
- `credentials.json` file for Google OAuth

## Installation
1. Clone this repository.  
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Place your `credentials.json` in the project root.

## Usage
1. Edit the JSON file (e.g., `assets/sample.json`) with your slide content.  
2. Run:
   ```bash
   python json2slides.py
   ```
3. On first run, authenticate your Google account in the browser when prompted.

## Customization
- Modify the `presentation_title` in `main()` to change the new presentation’s title.  
- Adjust formatting or layout in the `add_slide()` function.

## License
Published under the [MIT License](LICENSE).
