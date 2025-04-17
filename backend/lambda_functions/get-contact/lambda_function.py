import json
import requests
import os
from dotenv import load_dotenv
load_dotenv()

def lambda_handler(event, context):
    try:
        # Log request info
        method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')
        path = event.get('requestContext', {}).get('http', {}).get('path', 'UNKNOWN')
        print(f"REQUEST: {method} {path}")
        
        # Case-insensitive header check
        auth_header = None
        headers = event.get('headers', {})
        
        for key in headers:
            if key.lower() == 'x-auth':
                auth_header = headers[key]
                break

        if not auth_header or auth_header != os.environ.get('LOGIN_API_KEY'):
            print("RESPONSE: 401 Unauthorized")
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type, x-auth',
                    'Access-Control-Allow-Methods': 'GET'
                },
                'body': json.dumps({
                    'error': 'Unauthorized'
                })
            }

        # Get API key from environment variable
        api_key = os.environ['HUBSPOT_API_KEY']
        
        # HubSpot API setup
        list_id = 246
        url = f"https://api.hubapi.com/contacts/v1/lists/{list_id}/contacts/all"
        
        # Initialize contacts list
        all_contacts = []
        
        # Pagination parameters
        params = {
            "count": 100,
            "property": [
                "firstname",
                "lastname",
                "hs_linkedin_url",
                "organic_social_outreached",
                "post_name"
            ]
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Fetch all contacts with pagination
        while True:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            if "contacts" in data:
                all_contacts.extend(data["contacts"])
            
            # Check for more contacts
            if data.get("has-more", False) and "vid-offset" in data:
                params["vidOffset"] = data["vid-offset"]
            else:
                break
        
        # Process contacts
        unprocessed_contacts = []
        for contact in all_contacts:
            props = contact.get('properties', {})
            if props.get('organic_social_outreached', {}).get('value') not in ['Yes', 'No']:
                unprocessed_contacts.append({
                    'vid': contact.get('vid'),
                    'firstname': props.get('firstname', {}).get('value'),
                    'lastname': props.get('lastname', {}).get('value'),
                    'linkedin_url': props.get('hs_linkedin_url', {}).get('value'),
                    'post_name': props.get('post_name', {}).get('value')
                })
        
        print("RESPONSE: 200 OK")
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps({
                'contacts': unprocessed_contacts[:1]
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
    
# Test Comment: to see if function is updated by GitHub Push; push using 3.9.21; 2 