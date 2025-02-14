# JSON to Google Slides

This tool converts a JSON file into a Google Slides presentation using the Google Slides API. It reads slide data (title, content, and notes) from a JSON file and creates a new presentation with optional speaker notes.

## Prerequisites
- Python 3.x  
- A Google Cloud project with the Slides and Drive APIs enabled  
- A valid OAuth 2.0 credentials file (`credentials.json`)

## Installation
1. Clone this repository.  
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Place `credentials.json` in the project root.

## Configuration
Create a configuration file (JSON format) to set presentation properties and specify the Google Drive folder for the new presentation.

Example configuration:
```json
{
    "presentation_title": "My Presentation",
    "drive_folder": "json2slides_output"
}
```
Update the values as needed.

## Slide Data
Edit the JSON file (located in the `slides` directory) to define your slide content. Each slide entry should include a title, an array of content paragraphs, and speaker notes.

## Usage
1. Update your slide content in the JSON file (e.g., `slides/sample.json`).  
2. Run the tool:
   ```bash
   python json2slides.py
   ```
3. Authenticate with your Google account if prompted (first run only).

## Troubleshooting
- Verify that your OAuth credentials are correct and that the Slides and Drive APIs are enabled.
- Ensure the configuration file and slide JSON structure follow the specified format.

## License
Published under the [MIT License](LICENSE).

