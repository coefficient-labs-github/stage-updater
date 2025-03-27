import json
import os
import requests

def lambda_handler(event, context):
    try:
        # Get API key from environment variable
        api_key = os.environ['HUBSPOT_API_KEY']
        
        # Parse the request body
        contact_vid = event.get('vid')
        value = event.get('value', 'Yes') 
        note = event.get('note', '')  
        
        if not contact_vid:
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
        print(f"Error occurred: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e)
            })
        } 
    
# Test Comment: to see if lambda function is updated by GitHub Push; push using 3.9.*