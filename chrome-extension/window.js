let API_URL = "https://9kzy6h2ww4.execute-api.us-east-2.amazonaws.com/prod"; // default production URL

// GET EXAMPLE
// curl -X GET http://localhost:3000/contact \
//   -H "x-auth: YOUR_LOGIN_API_KEY" \
//   -H "Content-Type: application/json"

// POST EXAMPLE
// curl -X POST http://localhost:3000/contact \
//   -H "x-auth: YOUR_LOGIN_API_KEY" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "vid": "CONTACT_VID",
//     "value": "Yes",
//     "note": "Test note for the contact"
//   }'

// Initialize the API URL from config if available
function initializeConfig() {
  return import("./config.js")
    .then((localConfig) => {
      API_URL = localConfig.default.API_URL;
      console.log("Using local development URL:", API_URL);
    })
    .catch((error) => {
      console.log("No local config found, using production URL:", API_URL);
    });
}

let currentContactVid = null;

// Show/hide screen functions
function showScreen(screenId) {
  const screens = ["loadingScreen", "setupScreen", "mainScreen"];
  screens.forEach((screen) => {
    const element = document.getElementById(screen);
    if (element) {
      element.style.display = screen === screenId ? "block" : "none";
    }
  });
}

// Validate API key against the backend
async function validateApiKey(apiKey) {
  try {
    const response = await fetch(`${API_URL}/contact`, {
      headers: {
        "x-auth": apiKey,
      },
    });
    return response.status === 200;
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
}

// Check authentication and handle the flow
async function checkAuthentication() {
  const result = await chrome.storage.local.get(["loginApiKey"]);

  if (!result.loginApiKey) {
    return false;
  }

  // Validate the stored key
  const isValid = await validateApiKey(result.loginApiKey);
  if (!isValid) {
    // Clear invalid key
    await chrome.storage.local.remove(["loginApiKey"]);
    return false;
  }

  return true;
}

// Helper function to safely add event listeners
function addSafeEventListener(elementId, event, handler) {
  const element = document.getElementById(elementId);
  if (element) {
    element.addEventListener(event, handler);
  } else {
    console.error(`Element with id '${elementId}' not found`);
  }
}

// Initialize configuration and set up event listeners when the document loads
document.addEventListener("DOMContentLoaded", async () => {
  // Show loading screen immediately
  showScreen("loadingScreen");

  // Set up event listeners
  addSafeEventListener("saveConfig", "click", async () => {
    const apiKey = document.getElementById("apiKey")?.value.trim();
    if (!apiKey) {
      showError("Please enter your authentication key");
      return;
    }
    // Test the API key
    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      showError("Invalid authentication key. Please check and try again.");
      return;
    }
    // Store the key if valid
    await chrome.storage.local.set({ loginApiKey: apiKey });
    showMainScreen();
  });

  addSafeEventListener("getNextContact", "click", async () => {
    try {
      // Check authentication before proceeding
      const isAuthenticated = await checkAuthentication();
      if (!isAuthenticated) {
        return;
      }

      document.getElementById("getNextContact").style.display = "none";
      const result = await chrome.storage.local.get(["loginApiKey"]);

      const response = await fetch(`${API_URL}/contact`, {
        headers: {
          "x-auth": result.loginApiKey,
        },
      });

      if (response.status === 401) {
        await chrome.storage.local.remove(["loginApiKey"]);
        showSetupScreen(
          "Your session has expired. Please enter your authentication key again."
        );
        return;
      }

      const data = await response.json();
      console.log("Response data:", data);

      // The response.body is already a JSON string that contains the contacts
      if (data.contacts && data.contacts.length > 0) {
        console.log("Found contact:", data.contacts[0]);
        displayContact(data.contacts[0]);
      } else {
        document.getElementById("contactInfo").innerHTML =
          "<p>No contacts to process</p>";
        document.getElementById("getNextContact").style.display = "block";
      }
    } catch (error) {
      console.error("Detailed error:", error);
      document.getElementById(
        "contactInfo"
      ).innerHTML = `<p>Error fetching contact: ${error.message}</p>`;
      document.getElementById("getNextContact").style.display = "block";
    }
  });

  try {
    await initializeConfig();
    const isAuthenticated = await checkAuthentication();
    if (isAuthenticated) {
      showScreen("mainScreen");
    } else {
      showScreen("setupScreen");
    }
  } catch (error) {
    console.error("Initialization error:", error);
    showScreen("setupScreen");
  }
});

// Display contact information
function displayContact(contact) {
  currentContactVid = contact.vid;

  // Instead of opening a new tab, use chrome.tabs.update to navigate current tab
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs[0]) {
      chrome.tabs.update(tabs[0].id, { url: contact.linkedin_url });
    } else {
      chrome.tabs.create({ url: contact.linkedin_url, active: true });
    }
  });

  document.getElementById("contactInfo").innerHTML = `
    <p data-vid="${contact.vid}">Name: ${contact.firstname} ${contact.lastname}</p>
    <p>Post: ${contact.post_name}</p>
    <div class="notes-section">
      <label for="outreachNote">Outreach Notes:</label>
      <textarea id="outreachNote" placeholder="Add your outreach notes here..."></textarea>
    </div>
    <div class="button-group">
      <button class="yes-button" id="markYes">Yes</button>
      <button class="no-button" id="markNo">No</button>
    </div>
  `;

  // Add event listeners for Yes/No buttons
  document
    .getElementById("markYes")
    .addEventListener("click", () => updateContact("Yes"));
  document
    .getElementById("markNo")
    .addEventListener("click", () => updateContact("No"));
}

// Helper functions
function showSetupScreen(message = null) {
  document.getElementById("setupScreen").style.display = "block";
  document.getElementById("mainScreen").style.display = "none";

  if (message) {
    document.getElementById("setupMessage").textContent = message;
  }
}

function showMainScreen() {
  document.getElementById("setupScreen").style.display = "none";
  document.getElementById("mainScreen").style.display = "block";
}

function showError(message) {
  const errorElement = document.getElementById("errorMessage");
  errorElement.textContent = message;
  errorElement.style.display = "block";
  setTimeout(() => {
    errorElement.style.display = "none";
  }, 3000);
}

async function updateContact(value) {
  if (!currentContactVid) return;

  const noteText = document.getElementById("outreachNote").value;
  const result = await chrome.storage.local.get(["loginApiKey"]);

  try {
    await fetch(`${API_URL}/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auth": result.loginApiKey,
      },
      body: JSON.stringify({
        vid: currentContactVid,
        value: value,
        note: noteText,
      }),
    });
    // After successful update, show the button again and clear the contact info
    document.getElementById("getNextContact").style.display = "block";
    document.getElementById("contactInfo").innerHTML = "";
    // Automatically click the button to get the next contact
    document.getElementById("getNextContact").click();
  } catch (error) {
    console.error("Error:", error);
    alert("Error updating contact");
  }
}

// Add this function to handle popup closing
function handlePopupClose() {
  // Save any necessary state before popup closes
  if (currentContactVid) {
    chrome.storage.local.set({ lastContactVid: currentContactVid });
  }
}

// Add event listener for popup closing
window.addEventListener("unload", handlePopupClose);
