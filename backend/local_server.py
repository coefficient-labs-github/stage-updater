# backend/local_server.py
import os
import importlib.util
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import lambda functions using file paths
def import_lambda(path):
    spec = importlib.util.spec_from_file_location("lambda_function", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.lambda_handler

# Import handlers
get_contact_handler = import_lambda("lambda_functions/get-contact/lambda_function.py")
update_contact_handler = import_lambda("lambda_functions/update-contact/lambda_function.py")

# Load environment variables from .env file if it exists
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
PORT = int(os.getenv('PORT', 3000))
DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

def lambda_to_flask(handler):
    """Convert Lambda response to Flask response"""
    def wrapper(*args, **kwargs):
        # Create Lambda-style event
        event = {
            'headers': dict(request.headers),
            'body': request.get_data(as_text=True),
            'queryStringParameters': dict(request.args),
            'pathParameters': kwargs,
            'requestContext': {
                'http': {
                    'method': request.method,
                    'path': request.path
                }
            }
        }
        
        # Call Lambda handler
        result = handler(event, {})
        
        # Convert Lambda response to Flask response
        return (
            result['body'],
            result['statusCode'],
            result.get('headers', {})
        )
    return wrapper

# Routes with unique endpoint names
app.route('/contact', methods=['GET'], endpoint='get_contact')(lambda_to_flask(get_contact_handler))
app.route('/contact', methods=['POST'], endpoint='update_contact')(lambda_to_flask(update_contact_handler))

if __name__ == '__main__':
    print(f"Starting server on port {PORT} (Debug: {DEBUG})")
    app.run(port=PORT, debug=DEBUG)