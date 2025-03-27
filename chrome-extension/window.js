let currentContactVid = null;

document.getElementById('getNextContact').addEventListener('click', async () => {
    try {
      // Hide the button after clicking
      document.getElementById('getNextContact').style.display = 'none';
      
      const response = await fetch('https://9kzy6h2ww4.execute-api.us-east-2.amazonaws.com/prod/contact');
      const data = await response.json();
      const bodyData = JSON.parse(data.body);
      
      if (bodyData.contacts && bodyData.contacts.length > 0) {
        const contact = bodyData.contacts[0];
        currentContactVid = contact.vid;
        
        // Open LinkedIn profile in new tab
        chrome.tabs.create({ url: contact.linkedin_url, active: true });
        
        document.getElementById('contactInfo').innerHTML = `
          <p>Name: ${contact.firstname} ${contact.lastname}</p>
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
        document.getElementById('markYes').addEventListener('click', () => updateContact('Yes'));
        document.getElementById('markNo').addEventListener('click', () => updateContact('No'));
      } else {
        document.getElementById('contactInfo').innerHTML = '<p>No contacts to process</p>';
        // Show the button again if there are no contacts
        document.getElementById('getNextContact').style.display = 'block';
      }
    } catch (error) {
      console.error('Error:', error);
      document.getElementById('contactInfo').innerHTML = '<p>Error fetching contact</p>';
      // Show the button again if there's an error
      document.getElementById('getNextContact').style.display = 'block';
    }
});

async function updateContact(value) {
    if (!currentContactVid) return;
    
    const noteText = document.getElementById('outreachNote').value;
    
    try {
        await fetch('https://9kzy6h2ww4.execute-api.us-east-2.amazonaws.com/prod/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                vid: currentContactVid,
                value: value,
                note: noteText
            })
        });
        // After successful update, show the button again and clear the contact info
        document.getElementById('getNextContact').style.display = 'block';
        document.getElementById('contactInfo').innerHTML = '';
        // Automatically click the button to get the next contact
        document.getElementById('getNextContact').click();
    } catch (error) {
        console.error('Error:', error);
        alert('Error updating contact');
    }
} 