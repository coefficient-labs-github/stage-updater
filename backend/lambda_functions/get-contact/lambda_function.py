import json
import boto3
from botocore.exceptions import ClientError
import requests
import os

def get_hubspot_key():
    """Retrieve HubSpot API key from AWS Secrets Manager"""
    secret_name = "hubspot/api_key"
    region_name = "us-east-1"  
    
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    try:
        secret_value = client.get_secret_value(SecretId=secret_name)
        return json.loads(secret_value['SecretString'])['HUBSPOT_API_KEY']
    except ClientError as e:
        raise e

def lambda_handler(event, context):
    try:
        # Get API key from environment variable
        api_key = os.environ['HUBSPOT_API_KEY']
        print(f"API Key exists: {'HUBSPOT_API_KEY' in os.environ}")
        
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
                print(f"Fetched {len(data['contacts'])} contacts in this batch")
            
            # Check for more contacts
            if data.get("has-more", False) and "vid-offset" in data:
                params["vidOffset"] = data["vid-offset"]
                print(f"Getting next batch with offset: {data['vid-offset']}")
            else:
                break
        
        print(f"Total contacts fetched: {len(all_contacts)}")
        
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
        
        print(f"Found {len(unprocessed_contacts)} unprocessed contacts")
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET'
            },
            'body': json.dumps({
                # Return only the next contact
                'contacts': unprocessed_contacts[:1]  
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
    
# Test Comment: to see if function is updated by GitHub Push; push using 3.9.21; 2 