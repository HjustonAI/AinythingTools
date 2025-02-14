import json
import os
import uuid

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = [
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive'
]

def get_creds():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                'credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    return creds

def get_slides_service(creds):
    return build('slides', 'v1', credentials=creds)

def get_drive_service(creds):
    return build('drive', 'v3', credentials=creds)

def create_presentation(slides_service, title):
    body = {'title': title}
    presentation = slides_service.presentations().create(body=body).execute()
    print(f"Created presentation with ID: {presentation.get('presentationId')}")
    return presentation.get('presentationId')

def get_or_create_folder(drive_service, folder_name):
    query = (
        f"name = '{folder_name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    )
    response = drive_service.files().list(q=query, fields="files(id, name)").execute()
    files = response.get('files', [])
    if files:
        folder_id = files[0]['id']
        print(f"Folder '{folder_name}' found with ID: {folder_id}")
        return folder_id

    file_metadata = {
        'name': folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }
    folder = drive_service.files().create(body=file_metadata, fields='id').execute()
    folder_id = folder.get('id')
    print(f"Folder '{folder_name}' created with ID: {folder_id}")
    return folder_id

def move_presentation_to_folder(drive_service, presentation_id, folder_id):
    file_info = drive_service.files().get(fileId=presentation_id, fields='parents').execute()
    previous_parents = ",".join(file_info.get('parents', []))
    drive_service.files().update(
        fileId=presentation_id,
        addParents=folder_id,
        removeParents=previous_parents,
        fields='id, parents'
    ).execute()
    print(f"Presentation moved to folder ID: {folder_id}")

def add_slide(slides_service, presentation_id, slide_data):
    """
    Tworzy nowy slajd (BLANK) i dodaje:
    - Tytuł
    - Treść główną
    - Notatki (wpisane w treść slajdu, po pustej linii), pogrubione i kursywą
    """
    requests = []

    new_slide_id = f"slide_{uuid.uuid4().hex}"

    # Tworzymy slajd (BLANK)
    requests.append({
        'createSlide': {
            'objectId': new_slide_id,
            'slideLayoutReference': {
                'predefinedLayout': 'BLANK'
            }
        }
    })

    # Tytuł slajdu
    title_box_id = f"{new_slide_id}_title_box"
    requests.append({
        'createShape': {
            'objectId': title_box_id,
            'shapeType': 'TEXT_BOX',
            'elementProperties': {
                'pageObjectId': new_slide_id,
                'size': {
                    'height': {'magnitude': 60, 'unit': 'PT'},
                    'width': {'magnitude': 400, 'unit': 'PT'}
                },
                'transform': {
                    'scaleX': 1,
                    'scaleY': 1,
                    'translateX': 50,
                    'translateY': 20,
                    'unit': 'PT'
                }
            }
        }
    })
    requests.append({
        'insertText': {
            'objectId': title_box_id,
            'insertionIndex': 0,
            'text': slide_data.get('title', 'Untitled Slide')
        }
    })

    # Pole na treść i notatki
    content_box_id = f"{new_slide_id}_content_box"
    requests.append({
        'createShape': {
            'objectId': content_box_id,
            'shapeType': 'TEXT_BOX',
            'elementProperties': {
                'pageObjectId': new_slide_id,
                'size': {
                    'height': {'magnitude': 300, 'unit': 'PT'},
                    'width': {'magnitude': 400, 'unit': 'PT'}
                },
                'transform': {
                    'scaleX': 1,
                    'scaleY': 1,
                    'translateX': 50,
                    'translateY': 100,
                    'unit': 'PT'
                }
            }
        }
    })

    paragraphs = slide_data.get('content', [])
    content_text = "\n".join(paragraphs).strip()
    notes_text = slide_data.get('notes', '').strip()

    # Formatowanie tekstu - notatki jako bold + italic
    if notes_text:
        combined_text = content_text + "\n\n" + notes_text if content_text else notes_text
    else:
        combined_text = content_text

    requests.append({
        'insertText': {
            'objectId': content_box_id,
            'insertionIndex': 0,
            'text': combined_text
        }
    })

    # Jeśli mamy notatki, ustawiamy im pogrubienie i kursywę
    if notes_text:
        start_index = len(content_text) + 2 if content_text else 0
        end_index = len(combined_text)
        requests.append({
            'updateTextStyle': {
                'objectId': content_box_id,
                'style': {
                    'italic': True,
                    'bold': True
                },
                'textRange': {
                    'type': 'FIXED_RANGE',
                    'startIndex': start_index,
                    'endIndex': end_index
                },
                'fields': 'italic,bold'
            }
        })

    # Batch update (tworzenie slajdu, dodanie treści, stylizacja notatek)
    slides_service.presentations().batchUpdate(
        presentationId=presentation_id,
        body={'requests': requests}
    ).execute()

def main():
    try:
        creds = get_creds()
        slides_service = get_slides_service(creds)
        drive_service = get_drive_service(creds)
        
        # Set base_dir to the current script's directory (project root for this script)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Update config.json path relative to the current script folder
        config_path = os.path.join(base_dir, 'slides', 'assets', 'config.json')
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Update sample.json path relative to the current script folder
        json_path = os.path.join(base_dir, 'slides', 'sample.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            slides_data = json.load(f)
        
        presentation_title = config.get("presentation_title", "Default Title")
        folder_name = config.get("drive_folder", "json2slides_output")
        
        presentation_id = create_presentation(slides_service, presentation_title)
        
        for slide_info in slides_data:
            add_slide(slides_service, presentation_id, slide_info)
        
        folder_id = get_or_create_folder(drive_service, folder_name)
        move_presentation_to_folder(drive_service, presentation_id, folder_id)
        
        print(f"Gotowe! Sprawdź folder '{folder_name}' w Google Drive.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()