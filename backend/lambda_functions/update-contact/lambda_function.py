import json
import os
import requests
from dotenv import load_dotenv
load_dotenv()

def lambda_handler(event, context):
    try:
        # Log request info
        method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')
        path = event.get('requestContext', {}).get('http', {}).get('path', 'UNKNOWN')
        print(f"REQUEST: {method} {path}")
        
        # Log all headers for debugging
        headers = event.get('headers', {})
        print("All headers received:", json.dumps(headers, indent=2))
        
        # Case-insensitive header check
        auth_header = None
        for key in headers:
            if key.lower() == 'x-auth':
                auth_header = headers[key]
                print(f"Found x-auth header with value: {auth_header}")
                break

        expected_api_key = os.environ.get('LOGIN_API_KEY')
        print(f"Expected API key: {expected_api_key}")

        if not auth_header:
            print("No x-auth header found in request")
        elif not expected_api_key:
            print("No LOGIN_API_KEY found in environment variables")
        elif auth_header != expected_api_key:
            print("API key mismatch")

        if not auth_header or auth_header != expected_api_key:
            print("RESPONSE: 401 Unauthorized")
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, x-auth',
                    'Access-Control-Allow-Methods': 'POST'
                },
                'body': json.dumps({
                    'error': 'Unauthorized'
                })
            }

        # Get API key from environment variable
        api_key = os.environ['HUBSPOT_API_KEY']
        
        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        contact_vid = body.get('vid')
        value = body.get('value', 'Yes') 
        note = body.get('note', '')  
        
        if not contact_vid:
            print("RESPONSE: 400 Bad Request - Contact VID is required")
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                'body': json.dumps({
                    'error': 'Contact VID is required'
                })
            }
        
        # HubSpot API setup
        url = f"https://api.hubapi.com/contacts/v1/contact/vid/{contact_vid}/profile"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Prepare the update data
        data = {
            "properties": [
                {
                    "property": "organic_social_outreached",
                    "value": value
                },
                {
                    "property": "outreach_note",
                    "value": note
                }
            ]
        }
        
        # Update the contact in HubSpot
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        print("RESPONSE: 200 OK")
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({
                'message': 'Contact updated successfully',
                'vid': contact_vid,
                'value': value,
                'note': note
            })
        }
        
    except Exception as e:
        print("RESPONSE: 500 Internal Server Error")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error'
            })
        }
    
# Test Comment: to see if lambda function is updated by GitHub Push; push using 3.9.21