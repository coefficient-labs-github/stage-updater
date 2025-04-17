# LinkedIn Outreach Assistant

A Chrome extension that streamlines the LinkedIn outreach process by integrating with HubSpot. This tool helps manage and track outreach efforts efficiently by allowing users to view LinkedIn profiles and update contact statuses directly from the browser.

![Outreach Flow](media/flow.png)

## Features

- 🔒 Secure authentication system for organizational access
- 🔄 Seamless integration between LinkedIn and HubSpot
- 📝 Add outreach notes directly from LinkedIn
- ✅ Quick Yes/No status updates
- 🔄 Automatic contact status synchronization with HubSpot
- 🛠 Support for both local development and production environments

## Project Structure

```plaintext
stage-updater/
├── backend/
│   ├── lambda_functions/
│   │   ├── get-contact/
│   │   └── update-contact/
│   ├── local_server.py
│   ├── start-local.sh
│   ├── requirements.txt
│   ├── requirements.dev.txt
│   ├── .env
│   └── .example.env
├── chrome-extension/
│   ├── icons/
│   ├── manifest.json
│   ├── window.html
│   ├── window.js
│   ├── config.js
│   ├── config.example.js
│   ├── background.js
│   └── content.js
├── media/
│   └── flow.png
└── .github/
    └── workflows/
```

## Technical Architecture

### Backend (AWS Lambda)

The backend consists of two serverless functions:

- **Get Contact Lambda**: Retrieves the next contact to process from HubSpot
- **Update Contact Lambda**: Updates contact status and notes in HubSpot

### Chrome Extension

- **Popup Interface**: User-friendly interface for viewing and updating contact information
- **Authentication**: Secure access control using organization-specific API keys
- **LinkedIn Integration**: Automatically opens LinkedIn profiles for review
- **HubSpot Sync**: Direct updates to HubSpot contact records

## Setup and Installation

### Local Development

#### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Set up your environment variables:

   - Copy the example environment file:
     ```bash
     cp .example.env .env
     ```
   - Edit `.env` with your configuration:
     ```
     HUBSPOT_API_KEY=your_hubspot_api_key
     LOGIN_API_KEY=your_organization_key
     ```

3. Make the start script executable (first time only):

   ```bash
   chmod +x start-local.sh
   ```

4. Start the local server:
   ```bash
   ./start-local.sh
   ```
   This script will:
   - Create and activate a Python virtual environment
   - Install all required dependencies
   - Load environment variables
   - Start the local server

#### Chrome Extension Setup

1. Navigate to the chrome-extension directory:

   ```bash
   cd chrome-extension
   ```

2. Configure the development environment:

   - Copy the example config:
     ```bash
     cp config.example.js config.js
     ```
   - Edit `config.js` to point to your local server:
     ```javascript
     const config = {
       API_URL: "https://localhost:3000",
     };
     ```

3. Load the extension in Chrome:

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `chrome-extension` directory from your project

4. Development Tips:
   - After making changes to the extension code, click the "Reload" button on the extension card in `chrome://extensions/`
   - The extension popup can be inspected by right-clicking and selecting "Inspect"
   - Background and content scripts can be debugged through the extension's developer tools

### Deployment

The project uses GitHub Actions for automated deployment:

- Pushes to main branch trigger automatic updates to Lambda functions
- API Gateway configuration must be updated manually
- Chrome extension must be manually published to the Chrome Web Store

## Security

- Authentication required for all API endpoints
- API keys stored securely in AWS Lambda environment variables
- Sensitive configuration files excluded from version control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
