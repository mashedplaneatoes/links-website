document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const adminLogin = document.getElementById('admin-login');
  const adminPanel = document.getElementById('admin-panel');
  const addLinkForm = document.getElementById('add-link-form');
  const linksList = document.getElementById('links-list');
  const suggestionsList = document.getElementById('suggestions-list');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  console.log("Admin.js loaded");
  console.log("Login form exists:", !!loginForm);
  console.log("Admin login section exists:", !!adminLogin);
  console.log("Admin panel exists:", !!adminPanel);
  
  // Hide error message initially
  if (loginError) {
    loginError.classList.add('hidden');
  }
  
  // Track admin status
  let isAdmin = false;
  
  // Check if already logged in
  const adminPassword = localStorage.getItem('adminPassword');
  if (adminPassword) {
    verifyAdminPassword(adminPassword);
  }
  
  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.log("Login form submitted");
      
      const password = document.getElementById('admin-password').value.trim();
      
      if (!password) {
        showLoginError('Please enter a password');
        return;
      }
      
      verifyAdminPassword(password);
    });
  }
  
  // Function to verify admin password
  function verifyAdminPassword(password) {
    console.log("Verifying password...");
    
    db.collection('admin').doc('credentials').get()
      .then(doc => {
        console.log("Got credentials document:", doc.exists);
        
        if (!doc.exists) {
          showLoginError('Admin credentials not found');
          return;
        }
        
        const credentials = doc.data();
        console.log("Comparing passwords...");
        
        if (password === credentials.password) {
          // Password is correct, show admin panel
          console.log("Password correct!");
          isAdmin = true;
          localStorage.setItem('adminPassword', password);
          showAdminPanel();
          loadLinks();
          loadSuggestions();
        } else {
          console.log("Password incorrect!");
          showLoginError('Incorrect password');
          localStorage.removeItem('adminPassword');
        }
      })
      .catch(error => {
        console.error("Error verifying admin password:", error);
        showLoginError('Error verifying password. Please try again.');
      });
  }
  
  // Function to show login error
  function showLoginError(message) {
    console.log("Showing login error:", message);
    if (loginError) {
      loginError.textContent = message;
      loginError.classList.remove('hidden');
    }
  }
  
  // Function to show admin panel
  function showAdminPanel() {
    console.log("Showing admin panel");
    if (adminLogin && adminPanel) {
      adminLogin.classList.add('hidden');
      adminPanel.classList.remove('hidden');
    }
  }
  
  // Handle tab switching
  if (tabButtons) {
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        tabButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Hide all tab contents
        tabContents.forEach(content => content.classList.add('hidden'));
        
        // Show selected tab content
        const tabId = button.getAttribute('data-tab');
        const tabContent = document.getElementById(tabId);
        if (tabContent) {
          tabContent.classList.remove('hidden');
        }
        
        // Load data for the tab if needed
        if (tabId === 'manage-links') {
          loadLinks();
        } else if (tabId === 'review-suggestions') {
          loadSuggestions();
        }
      });
    });
  }
  
  // Handle adding a new link
  if (addLinkForm) {
    addLinkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!isAdmin) {
        alert('You must be logged in as admin to add links');
        return;
      }
      
      const name = document.getElementById('link-name').value.trim();
      const url = document.getElementById('link-url').value.trim();
      const password = document.getElementById('link-password').value.trim();
      const visible = document.getElementById('link-visible').checked;
      const folder = document.getElementById('link-folder').value.trim();
      const subfolder = document.getElementById('link-subfolder').value.trim();
      
      try {
        // Add link to Firestore
        await db.collection('links').add({
          name,
          url,
          password: password || null,
          visible,
          folder: folder || null,
          subfolder: subfolder || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Reset form and reload links
        addLinkForm.reset();
        loadLinks();
        
        alert('Link added successfully');
      } catch (error) {
        console.error("Error adding link:", error);
        alert('Error adding link. Please try again.');
      }
    });
  }
  
  // Function to load links
  async function loadLinks() {
    if (!isAdmin || !linksList) return;
    
    linksList.innerHTML = '<p class="loading-message">Loading links...</p>';
    
    try {
      const snapshot = await db.collection('links')
        .orderBy('createdAt', 'desc')
        .get();
      
      if (snapshot.empty) {
        linksList.innerHTML = '<p>No links found.</p>';
        return;
      }
      
      linksList.innerHTML = '';
      
      snapshot.forEach(doc => {
        const link = doc.data();
        const linkId = doc.id;
        
        const linkElement = document.createElement('div');
        linkElement.className = 'admin-list-item';
        linkElement.innerHTML = `
          <h4>
            ${link.name}
            <span class="status-badge">${link.visible ? 'Visible' : 'Hidden'}</span>
          </h4>
          <p>URL: <a href="${link.url}" target="_blank">${link.url}</a></p>
          <p>Password: ${link.password ? link.password : 'None'}</p>
          <p>Folder: ${link.folder ? link.folder : 'None'}</p>
          <p>Subfolder: ${link.subfolder ? link.subfolder : 'None'}</p>
          
          <div class="admin-actions">
            <button class="edit-button" onclick="editLink('${linkId}')">Edit</button>
            <button class="delete-button" onclick="deleteLink('${linkId}')">Delete</button>
          </div>
        `;
        
        linksList.appendChild(linkElement);
      });
    } catch (error) {
      console.error("Error loading links:", error);
      linksList.innerHTML = '<p class="error-message">Error loading links. Please try again.</p>';
    }
  }
  
  // Function to load suggestions
  async function loadSuggestions() {
    if (!isAdmin || !suggestionsList) return;
    
    suggestionsList.innerHTML = '<p class="loading-message">Loading suggestions...</p>';
    
    try {
      const snapshot = await db.collection('suggestions')
        .orderBy('createdAt', 'desc')
        .get();
      
      if (snapshot.empty) {
        suggestionsList.innerHTML = '<p>No suggestions found.</p>';
        return;
      }
      
      suggestionsList.innerHTML = '';
      
      snapshot.forEach(doc => {
        const suggestion = doc.data();
        const suggestionId = doc.id;
        
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'admin-list-item';
        suggestionElement.innerHTML = `
          <h4>${suggestion.name}</h4>
          <p>URL: <a href="${suggestion.url}" target="_blank">${suggestion.url}</a></p>
          ${suggestion.description ? `<p>Description: ${suggestion.description}</p>` : ''}
          ${suggestion.imageUrl ? `<p>Image URL: <a href="${suggestion.imageUrl}" target="_blank">${suggestion.imageUrl}</a></p>` : ''}
          
          <div class="admin-actions">
            <button class="approve-button" onclick="approveSuggestion('${suggestionId}')">Approve</button>
            <button class="delete-button" onclick="deleteSuggestion('${suggestionId}')">Delete</button>
          </div>
        `;
        
        suggestionsList.appendChild(suggestionElement);
      });
    } catch (error) {
      console.error("Error loading suggestions:", error);
      suggestionsList.innerHTML = '<p class="error-message">Error loading suggestions. Please try again.</p>';
    }
  }
});

// Global functions for link and suggestion management
window.editLink = function(linkId) {
  if (!document.querySelector('.admin-panel:not(.hidden)')) return;
  
  const editButton = document.querySelector(`button.edit-button[onclick*="${linkId}"]`);
  if (!editButton) return;
  
  const listItem = editButton.closest('.admin-list-item');
  if (!listItem) return;
  
  db.collection('links').doc(linkId).get()
    .then(doc => {
      if (!doc.exists) {
        alert('Link not found');
        return;
      }
      
      const link = doc.data();
      
      // Create edit form
      const editForm = document.createElement('div');
      editForm.className = 'edit-form';
      editForm.innerHTML = `
        <div class="form-group">
          <label for="edit-name-${linkId}">Name:</label>
          <input type="text" id="edit-name-${linkId}" value="${link.name}" required>
        </div>
        <div class="form-group">
          <label for="edit-url-${linkId}">URL:</label>
          <input type="url" id="edit-url-${linkId}" value="${link.url}" required>
        </div>
        <div class="form-group">
          <label for="edit-password-${linkId}">Password:</label>
          <input type="text" id="edit-password-${linkId}" value="${link.password || ''}">
        </div>
        <div class="form-group">
          <label for="edit-folder-${linkId}">Folder:</label>
          <input type="text" id="edit-folder-${linkId}" value="${link.folder || ''}">
        </div>
        <div class="form-group">
          <label for="edit-subfolder-${linkId}">Subfolder:</label>
          <input type="text" id="edit-subfolder-${linkId}" value="${link.subfolder || ''}">
        </div>
        <div class="form-group checkbox">
          <input type="checkbox" id="edit-visible-${linkId}" ${link.visible ? 'checked' : ''}>
          <label for="edit-visible-${linkId}">Visible</label>
        </div>
        <button type="button" onclick="saveLink('${linkId}')">Save</button>
        <button type="button" onclick="cancelEdit('${linkId}')">Cancel</button>
      `;
      
      // Add edit form to list item
      listItem.appendChild(editForm);
      
      // Hide the action buttons
      const actionButtons = listItem.querySelector('.admin-actions');
      if (actionButtons) {
        actionButtons.style.display = 'none';
      }
    })
    .catch(error => {
      console.error("Error getting link:", error);
      alert('Error getting link details. Please try again.');
    });
};

window.saveLink = function(linkId) {
  if (!document.querySelector('.admin-panel:not(.hidden)')) return;
  
  const name = document.getElementById(`edit-name-${linkId}`).value.trim();
  const url = document.getElementById(`edit-url-${linkId}`).value.trim();
  const password = document.getElementById(`edit-password-${linkId}`).value.trim();
  const visible = document.getElementById(`edit-visible-${linkId}`).checked;
  const folder = document.getElementById(`edit-folder-${linkId}`).value.trim();
  const subfolder = document.getElementById(`edit-subfolder-${linkId}`).value.trim();
  
  if (!name || !url) {
    alert('Name and URL are required');
    return;
  }
  
  db.collection('links').doc(linkId).update({
    name,
    url,
    password: password || null,
    visible,
    folder: folder || null,
    subfolder: subfolder || null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
    // Reload links by triggering the active tab
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
      activeTab.click();
    }
  })
  .catch(error => {
    console.error("Error updating link:", error);
    alert('Error updating link. Please try again.');
  });
};

window.cancelEdit = function(linkId) {
  const saveButton = document.querySelector(`button[onclick*="saveLink('${linkId}')"]`);
  if (!saveButton) return;
  
  const listItem = saveButton.closest('.admin-list-item');
  if (!listItem) return;
  
  // Remove edit form
  const editForm = listItem.querySelector('.edit-form');
  if (editForm) {
    editForm.remove();
  }
  
  // Show action buttons
  const actionButtons = listItem.querySelector('.admin-actions');
  if (actionButtons) {
    actionButtons.style.display = 'flex';
  }
};

window.deleteLink = function(linkId) {
  if (!document.querySelector('.admin-panel:not(.hidden)')) return;
  
  if (!confirm('Are you sure you want to delete this link?')) {
    return;
  }
  
  db.collection('links').doc(linkId).delete()
    .then(() => {
      // Reload links by triggering the active tab
      const activeTab = document.querySelector('.tab-button.active');
      if (activeTab) {
        activeTab.click();
      }
    })
    .catch(error => {
      console.error("Error deleting link:", error);
      alert('Error deleting link. Please try again.');
    });
};

window.approveSuggestion = function(suggestionId) {
  if (!document.querySelector('.admin-panel:not(.hidden)')) return;
  
  db.collection('suggestions').doc(suggestionId).get()
    .then(doc => {
      if (!doc.exists) {
        alert('Suggestion not found');
        return;
      }
      
      const suggestion = doc.data();
      
      // Add to links collection
      return db.collection('links').add({
        name: suggestion.name,
        url: suggestion.url,
        password: null,
        visible: true,
        folder: null,
                subfolder: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        // Delete the suggestion
        return db.collection('suggestions').doc(suggestionId).delete();
      })
      .then(() => {
        // Reload tabs
        const activeTab = document.querySelector('.tab-button.active');
        if (activeTab) {
          activeTab.click();
        }
        alert('Suggestion approved and added to links');
      });
    })
    .catch(error => {
      console.error("Error approving suggestion:", error);
      alert('Error approving suggestion. Please try again.');
    });
};

window.deleteSuggestion = function(suggestionId) {
  if (!document.querySelector('.admin-panel:not(.hidden)')) return;
  
  if (!confirm('Are you sure you want to delete this suggestion?')) {
    return;
  }
  
  db.collection('suggestions').doc(suggestionId).delete()
    .then(() => {
      // Reload suggestions by triggering the active tab
      const activeTab = document.querySelector('.tab-button.active');
      if (activeTab) {
        activeTab.click();
      }
    })
    .catch(error => {
      console.error("Error deleting suggestion:", error);
      alert('Error deleting suggestion. Please try again.');
    });
};

        
