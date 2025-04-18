// API EXAMPLES
// curl -X GET http://localhost:3000/contact \
//   -H "x-auth: YOUR_LOGIN_API_KEY" \
//   -H "Content-Type: application/json"

// curl -X POST http://localhost:3000/contact \
//   -H "x-auth: YOUR_LOGIN_API_KEY" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "vid": "CONTACT_VID",
//     "value": "Yes",
//     "note": "Test note for the contact"
//   }'

// Configuration
let API_URL = "https://9kzy6h2ww4.execute-api.us-east-2.amazonaws.com/prod";
let currentContactVid = null;

const Views = {
  LOADING: "loadingView",
  LOGIN: "loginView",
  CONTACT: "contactView",
  ERROR: "errorView",
};

// Initialization
async function initializeConfig() {
  try {
    const localConfig = await import("./config.js");
    API_URL = localConfig.default.API_URL;
    console.log("Using local development URL:", API_URL);
  } catch (error) {
    console.log("No local config found, using production URL:", API_URL);
  }
}

// View Management
function showView(viewId) {
  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });
  document.getElementById(viewId).classList.add("active");
}

// Storage Management
async function getStoredApiKey() {
  const storage = await chrome.storage.local.get(["loginApiKey"]);
  return storage.loginApiKey;
}

async function setStoredApiKey(apiKey) {
  await chrome.storage.local.set({ loginApiKey: apiKey });
}

async function clearStoredApiKey() {
  await chrome.storage.local.remove(["loginApiKey"]);
}

// API Functions
async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`${API_URL}/contact`, {
      headers: { "x-auth": apiKey },
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function fetchContact(apiKey) {
  const response = await fetch(`${API_URL}/contact`, {
    headers: { "x-auth": apiKey },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.contacts?.[0] || null;
}

async function updateContact(apiKey, vid, value, note) {
  const response = await fetch(`${API_URL}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-auth": apiKey,
    },
    body: JSON.stringify({ vid, value, note }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// UI Functions
function clearContactInputs() {
  document.getElementById("outreachNote").value = "";
}

function displayContact(contact) {
  currentContactVid = contact.vid;
  clearContactInputs();
  openLinkedInProfile(contact.linkedin_url);
  updateContactDisplay(contact);
}

function openLinkedInProfile(url) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url });
    }
  });
}

function updateContactDisplay(contact) {
  document.getElementById("contactInfo").innerHTML = `
    <h2>Contact Details</h2>
    <p>Name: ${contact.firstname} ${contact.lastname}</p>
    <p>Post: ${contact.post_name}</p>
  `;
}

// Error Handling
function handleError(error) {
  console.error("Error:", error);

  if (error.message === "UNAUTHORIZED") {
    clearStoredApiKey();
    showView(Views.LOGIN);
    return;
  }

  document.getElementById("errorMessage").textContent = error.message;
  showView(Views.ERROR);
}

// Flow Control
async function startContactFlow() {
  try {
    showView(Views.LOADING);
    const apiKey = await getStoredApiKey();

    if (!apiKey) {
      showView(Views.LOGIN);
      return;
    }

    await processNextContact(apiKey);
  } catch (error) {
    handleError(error);
  }
}

async function processNextContact(apiKey) {
  try {
    showView(Views.LOADING);
    const contact = await fetchContact(apiKey);

    if (!contact) {
      handleError(new Error("No contacts available"));
      return;
    }

    displayContact(contact);
    showView(Views.CONTACT);
  } catch (error) {
    handleError(error);
  }
}

// Event Handlers
async function handleLogin() {
  const apiKey = document.getElementById("apiKey").value.trim();

  if (!apiKey) {
    handleError(new Error("Please enter your authentication key"));
    return;
  }

  showView(Views.LOADING);

  try {
    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      handleError(new Error("Invalid authentication key"));
      return;
    }

    await setStoredApiKey(apiKey);
    await processNextContact(apiKey);
  } catch (error) {
    handleError(error);
  }
}

async function handleContactUpdate(value) {
  try {
    const apiKey = await getStoredApiKey();
    const noteText = document.getElementById("outreachNote").value;

    showView(Views.LOADING);
    await updateContact(apiKey, currentContactVid, value, noteText);
    await processNextContact(apiKey);
  } catch (error) {
    handleError(error);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  document.getElementById("loginButton").addEventListener("click", handleLogin);
  document
    .getElementById("markYes")
    .addEventListener("click", () => handleContactUpdate("Yes"));
  document
    .getElementById("markNo")
    .addEventListener("click", () => handleContactUpdate("No"));
  document
    .getElementById("retryButton")
    .addEventListener("click", startContactFlow);
}

// Initialize App
async function initializeApp() {
  await initializeConfig();
  setupEventListeners();
  startContactFlow();
}

// Entry Point
document.addEventListener("DOMContentLoaded", initializeApp);
