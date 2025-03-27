# LinkedIn Outreach Tool

## Project Overview
A Chrome Extension that streamlines LinkedIn outreach by integrating with HubSpot through AWS serverless backend.

## Architecture

### Backend (AWS)
- **AWS Lambda Functions**:
  - `get-contact`: Fetches next unprocessed contact
  - `update-contact`: Updates contact status in HubSpot
- **API Gateway**: RESTful endpoints
- **Secrets Manager**: Secure storage for HubSpot API key

### Frontend (Chrome Extension)
- **User Interface**:
  - Popup window with contact information
  - Yes/No decision buttons
  - Notes input field
- **Features**:
  - Automatic LinkedIn profile loading
  - Simple, intuitive interface
  - Direct communication with AWS backend

## Implementation Steps

### 1. Backend Setup
```bash
lambda_functions/
├── get_contact/
│   ├── lambda_function.py
│   └── requirements.txt
└── update_contact/
    ├── lambda_function.py
    └── requirements.txt
```

#### AWS Configuration
1. Create AWS Lambda functions
2. Set up API Gateway
3. Configure Secrets Manager
4. Set up IAM roles and permissions

### 2. Chrome Extension Development
```bash
chrome_extension/
├── manifest.json
├── popup.html
├── popup.js
├── styles.css
└── icons/
    └── icon48.png
```

## User Flow
1. User clicks extension icon in Chrome
2. Extension fetches next contact from AWS backend
3. LinkedIn profile opens automatically
4. User makes decision (Yes/No + Note)
5. Extension sends update to AWS backend
6. Next contact loads automatically

## Development Phases

### Phase 1: AWS Backend
- [ ] Set up AWS account and services
- [ ] Create Lambda functions
- [ ] Configure API Gateway
- [ ] Set up Secrets Manager
- [ ] Test endpoints

### Phase 2: Chrome Extension
- [ ] Create extension structure
- [ ] Implement popup UI
- [ ] Connect to AWS endpoints
- [ ] Handle LinkedIn tab management
- [ ] Test user flow

### Phase 3: Deployment & Distribution
- [ ] Deploy backend to AWS
- [ ] Package Chrome extension
- [ ] Create installation instructions
- [ ] Test end-to-end functionality

## Installation Instructions

### For Users (Your Boss)
1. Download the Chrome extension from the provided GitHub repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the downloaded extension folder
5. Click the extension icon to start using

### For Developers
1. Clone the repository
2. Set up AWS resources using provided scripts
3. Update API endpoints in extension code
4. Test locally before deployment

## Security Considerations
- API Gateway authentication
- Lambda execution roles
- Secrets management
- CORS configuration

## Maintenance
- Monitor Lambda execution
- Check API Gateway logs
- Update dependencies
- Backup configurations

## Resources
- AWS Lambda Documentation
- Chrome Extension Documentation
- HubSpot API Documentation
