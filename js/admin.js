document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const adminDashboard = document.getElementById('admin-dashboard');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutButton = document.getElementById('logout-button');
  const addLinkForm = document.getElementById('add-link-form');
  const linksList = document.getElementById('links-list');
  const suggestionsList = document.getElementById('suggestions-list');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Hide the login error initially
  loginError.style.display = 'none';
  
  // Admin authentication state
  let isAdmin = false;
  
  // Check if admin is already logged in
  checkAdminStatus();
  
  // Handle login form submission
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const password = document.getElementById('password').value.trim();
    
    if (!password) {
      showLoginError('Please enter a password');
      return;
    }
    
    try {
      // Get the admin document from Firestore
      const adminDoc = await db.collection('admin').doc('credentials').get();
      
      if (!adminDoc.exists) {
        showLoginError('Admin credentials not set up');
        return;
      }
      
      const adminData = adminDoc.data();
      
      // Compare the password (in a real app, you'd use proper authentication)
      if (password === adminData.password) {
        // Login successful
        localStorage.setItem('isAdmin', 'true');
        showAdminDashboard();
        loadLinks();
        loadSuggestions();
        setupBackgroundControls(); // Add background controls after login
      } else {
        showLoginError('Incorrect password');
      }
    } catch (error) {
      console.error("Login error:", error);
      showLoginError('Error logging in. Please try again.');
    }
  });
  
  // Handle logout
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('isAdmin');
    showLoginForm();
  });
  
  // Handle tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      // Update active tab button
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Show selected tab content
      tabContents.forEach(content => {
        content.classList.add('hidden');
      });
      document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    });
  });
  
  // Handle adding a new link
  addLinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      alert('You must be logged in as admin to add links');
      return;
    }
    
    const name = document.getElementById('link-name').value.trim();
    const url = document.getElementById('link-url').value.trim();
    const folder = document.getElementById('link-folder')?.value.trim();
    const subfolder = document.getElementById('link-subfolder')?.value.trim();
    const password = document.getElementById('link-password').value.trim();
    const visible = document.getElementById('link-visible').checked;
    
    try {
      // Add link to Firestore
      await db.collection('links').add({
        name,
        url,
        folder: folder || null,
        subfolder: subfolder || null,
        password: password || null,
        visible,
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
  
  // Function to check admin status
  function checkAdminStatus() {
    const adminStatus = localStorage.getItem('isAdmin');
    
    if (adminStatus === 'true') {
      isAdmin = true;
      showAdminDashboard();
      loadLinks();
      loadSuggestions();
      setupBackgroundControls(); // Add background controls if already logged in
    } else {
      isAdmin = false;
      showLoginForm();
    }
  }
  
  // Function to show login error
  function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
  }
  
  // Function to show login form
  function showLoginForm() {
    loginSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
    isAdmin = false;
    
    // Hide login error when showing the form
    loginError.style.display = 'none';
  }
  
  // Function to show admin dashboard
  function showAdminDashboard() {
    loginSection.classList.add('hidden');
    adminDashboard.classList.remove('hidden');
    isAdmin = true;
  }
  
  // Function to load links for admin
  async function loadLinks() {
    if (!isAdmin) return;
    
    try {
      const snapshot = await db.collection('links')
        .orderBy('createdAt', 'desc')
        .get();
      
      if (snapshot.empty) {
        linksList.innerHTML = '<p>No links available.</p>';
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
            ${escapeHtml(link.name)}
            <span class="status-badge">${link.visible ? 'Visible' : 'Hidden'}</span>
          </h4>
          <p>URL: <a href="${escapeHtml(link.url)}" target="_blank">${escapeHtml(link.url)}</a></p>
          ${link.folder ? `<p>Folder: ${escapeHtml(link.folder)}</p>` : ''}
          ${link.subfolder ? `<p>Subfolder: ${escapeHtml(link.subfolder)}</p>` : ''}
          <p>Password: ${link.password ? escapeHtml(link.password) : 'None'}</p>
          
          <div class="admin-actions">
            <button class="edit-button" data-id="${linkId}">Edit</button>
            <button class="delete-button" data-id="${linkId}">Delete</button>
          </div>
        `;
        
        linksList.appendChild(linkElement);
        
        // Add event listeners for edit and delete buttons
        const editButton = linkElement.querySelector('.edit-button');
        const deleteButton = linkElement.querySelector('.delete-button');
        
        editButton.addEventListener('click', () => {
          editLink(linkId);
        });
        
        deleteButton.addEventListener('click', () => {
          deleteLink(linkId);
        });
      });
    } catch (error) {
      console.error("Error loading links:", error);
      linksList.innerHTML = '<p class="error-message">Error loading links. Please try again.</p>';
    }
  }
  
  // Function to load suggestions
  async function loadSuggestions() {
    if (!isAdmin) return;
    
    try {
      const snapshot = await db.collection('suggestions')
        .orderBy('createdAt', 'desc')
        .get();
      
      if (snapshot.empty) {
        suggestionsList.innerHTML = '<p>No suggestions available.</p>';
        return;
      }
      
      suggestionsList.innerHTML = '';
      
      snapshot.forEach(doc => {
        const suggestion = doc.data();
        const suggestionId = doc.id;
        
        const suggestionElement = document.createElement('div');
        suggestionElement.className = 'admin-list-item';
        suggestionElement.innerHTML = `
          <h4>${escapeHtml(suggestion.name)}</h4>
          <p>URL: <a href="${escapeHtml(suggestion.url)}" target="_blank">${escapeHtml(suggestion.url)}</a></p>
          ${suggestion.description ? `<p>Description: ${escapeHtml(suggestion.description)}</p>` : ''}
          ${suggestion.imageUrl ? `<p>Image URL: <a href="${escapeHtml(suggestion.imageUrl)}" target="_blank">View Image</a></p>` : ''}
          
          <div class="admin-actions">
            <button class="approve-button" data-id="${suggestionId}">Approve</button>
            <button class="delete-button" data-id="${suggestionId}">Delete</button>
          </div>
        `;
        
        suggestionsList.appendChild(suggestionElement);
        
        // Add event listeners for approve and delete buttons
        const approveButton = suggestionElement.querySelector('.approve-button');
        const deleteButton = suggestionElement.querySelector('.delete-button');
        
        approveButton.addEventListener('click', () => {
          approveSuggestion(suggestionId);
        });
        
        deleteButton.addEventListener('click', () => {
          deleteSuggestion(suggestionId);
        });
      });
    } catch (error) {
      console.error("Error loading suggestions:", error);
      suggestionsList.innerHTML = '<p class="error-message">Error loading suggestions. Please try again.</p>';
    }
  }
  
  // Function to edit a link
  function editLink(linkId) {
    if (!isAdmin) return;
    
    const listItem = document.querySelector(`.admin-list-item:has(.edit-button[data-id="${linkId}"])`);
    
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
            <input type="text" id="edit-name-${linkId}" value="${escapeHtml(link.name)}" required>
          </div>
          <div class="form-group">
            <label for="edit-url-${linkId}">URL:</label>
            <input type="url" id="edit-url-${linkId}" value="${escapeHtml(link.url)}" required>
          </div>
          <div class="form-group">
            <label for="edit-folder-${linkId}">Folder:</label>
            <input type="text" id="edit-folder-${linkId}" value="${link.folder ? escapeHtml(link.folder) : ''}">
          </div>
          <div class="form-group">
            <label for="edit-subfolder-${linkId}">Subfolder:</label>
            <input type="text" id="edit-subfolder-${linkId}" value="${link.subfolder ? escapeHtml(link.subfolder) : ''}">
          </div>
          <div class="form-group">
            <label for="edit-password-${linkId}">Password:</label>
            <input type="text" id="edit-password-${linkId}" value="${link.password ? escapeHtml(link.password) : ''}">
          </div>
          <div class="form-group checkbox">
            <input type="checkbox" id="edit-visible-${linkId}" ${link.visible ? 'checked' : ''}>
            <label for="edit-visible-${linkId}">Visible</label>
          </div>
          <button type="button" class="save-button" data-id="${linkId}">Save</button>
          <button type="button" class="cancel-button" data-id="${linkId}">Cancel</button>
        `;
        
        // Add edit form to list item
        listItem.appendChild(editForm);
        
        // Hide the action buttons
        const actionButtons = listItem.querySelector('.admin-actions');
        if (actionButtons) {
          actionButtons.style.display = 'none';
        }
        
        // Add event listeners for save and cancel
        const saveButton = editForm.querySelector('.save-button');
        const cancelButton = editForm.querySelector('.cancel-button');
        
        saveButton.addEventListener('click', () => {
          saveLink(linkId);
        });
        
        cancelButton.addEventListener('click', () => {
          cancelEdit(linkId);
        });
      })
      .catch(error => {
        console.error("Error getting link:", error);
        alert('Error getting link details. Please try again.');
      });
  }
  
  // Function to save edited link
  function saveLink(linkId) {
    if (!isAdmin) return;
    
    const name = document.getElementById(`edit-name-${linkId}`).value.trim();
    const url = document.getElementById(`edit-url-${linkId}`).value.trim();
    const folder = document.getElementById(`edit-folder-${linkId}`)?.value.trim();
    const subfolder = document.getElementById(`edit-subfolder-${linkId}`)?.value.trim();
    const password = document.getElementById(`edit-password-${linkId}`).value.trim();
    const visible = document.getElementById(`edit-visible-${linkId}`).checked;
    
    if (!name || !url) {
      alert('Name and URL are required');
      return;
    }
    
    db.collection('links').doc(linkId).update({
      name,
      url,
      folder: folder || null,
      subfolder: subfolder || null,
      password: password || null,
      visible,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      loadLinks();
    })
    .catch(error => {
      console.error("Error updating link:", error);
      alert('Error updating link. Please try again.');
    });
  }
  
  // Function to cancel edit
  function cancelEdit(linkId) {
    const listItem = document.querySelector(`.admin-list-item:has(.save-button[data-id="${linkId}"])`);
    
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
  }
  
  // Function to delete a link
  function deleteLink(linkId) {
    if (!isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this link?')) {
      return;
    }
    
    db.collection('links').doc(linkId).delete()
      .then(() => {
        loadLinks();
      })
      .catch(error => {
        console.error("Error deleting link:", error);
        alert('Error deleting link. Please try again.');
      });
  }
    // Function to approve a suggestion
  function approveSuggestion(suggestionId) {
    if (!isAdmin) return;
    
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
          folder: suggestion.folder || null,
          subfolder: suggestion.subfolder || null,
          password: null,
          visible: true,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
          // Delete the suggestion
          return db.collection('suggestions').doc(suggestionId).delete();
        })
        .then(() => {
          loadLinks();
          loadSuggestions();
          alert('Suggestion approved and added to links');
        });
      })
      .catch(error => {
        console.error("Error approving suggestion:", error);
        alert('Error approving suggestion. Please try again.');
      });
  }
  
  // Function to delete a suggestion
  function deleteSuggestion(suggestionId) {
    if (!isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this suggestion?')) {
      return;
    }
    
    db.collection('suggestions').doc(suggestionId).delete()
      .then(() => {
        loadSuggestions();
      })
      .catch(error => {
        console.error("Error deleting suggestion:", error);
        alert('Error deleting suggestion. Please try again.');
      });
  }
  
  // Function to set up background image controls
  function setupBackgroundControls() {
    if (!isAdmin) return;
    
    // Check if settings tab exists, if not create it
    let settingsTab = document.getElementById('settings-tab');
    let settingsTabButton = document.querySelector('.tab-button[data-tab="settings"]');
    
    if (!settingsTab) {
      // Create settings tab content
      settingsTab = document.createElement('div');
      settingsTab.id = 'settings-tab';
      settingsTab.className = 'tab-content hidden';
      
      // Create settings tab button
      if (!settingsTabButton) {
                settingsTabButton = document.createElement('button');
        settingsTabButton.className = 'tab-button';
        settingsTabButton.setAttribute('data-tab', 'settings');
        settingsTabButton.textContent = 'Settings';
        
        // Add the button to the tab navigation
        const tabNav = document.querySelector('.tab-navigation');
        if (tabNav) {
          tabNav.appendChild(settingsTabButton);
          
          // Add event listener for the new tab button
          settingsTabButton.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            settingsTabButton.classList.add('active');
            
            tabContents.forEach(content => {
              content.classList.add('hidden');
            });
            settingsTab.classList.remove('hidden');
          });
        }
      }
      
      // Add the settings tab to the admin dashboard
      adminDashboard.appendChild(settingsTab);
    }
    
    // Create background image controls in settings tab
    const backgroundControls = document.createElement('div');
    backgroundControls.className = 'settings-section';
    backgroundControls.innerHTML = `
      <h3>Background Image</h3>
      <div class="form-group">
        <label for="bg-image-url">Background Image URL:</label>
        <input type="text" id="bg-image-url" placeholder="Enter image URL">
      </div>
      <div class="form-actions">
        <button id="apply-bg" class="primary-button">Apply Background</button>
        <button id="remove-bg" class="secondary-button">Remove Background</button>
      </div>
    `;
    
    // Add the controls to the settings tab
    settingsTab.appendChild(backgroundControls);
    
    // Load current background image URL if exists
    db.collection('settings').doc('appearance').get()
      .then(doc => {
        if (doc.exists && doc.data().backgroundImage) {
          document.getElementById('bg-image-url').value = doc.data().backgroundImage;
        }
      })
      .catch(error => {
        console.error("Error getting background settings:", error);
      });
    
    // Apply background image
    document.getElementById('apply-bg').addEventListener('click', () => {
      const imageUrl = document.getElementById('bg-image-url').value.trim();
      if (imageUrl) {
        // Save to Firestore
        db.collection('settings').doc('appearance').set({
          backgroundImage: imageUrl
        }, { merge: true })
        .then(() => {
          applyBackgroundImage(imageUrl);
          alert('Background image updated successfully');
        })
        .catch(error => {
          console.error("Error saving background image:", error);
          alert('Error saving background image: ' + error.message);
        });
      }
    });
    
    // Remove background image
    document.getElementById('remove-bg').addEventListener('click', () => {
      // Remove from Firestore
      db.collection('settings').doc('appearance').update({
        backgroundImage: firebase.firestore.FieldValue.delete()
      })
      .then(() => {
        document.body.style.backgroundImage = '';
        document.body.classList.remove('with-bg-image');
        document.getElementById('bg-image-url').value = '';
        alert('Background image removed');
      })
      .catch(error => {
        console.error("Error removing background image:", error);
        alert('Error removing background image: ' + error.message);
      });
    });
    
    // Allow pressing Enter to apply background
    document.getElementById('bg-image-url').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('apply-bg').click();
      }
    });
  }
  
  // Function to apply background image
  function applyBackgroundImage(customUrl = null) {
    console.log("Applying background image:", customUrl);
    
    // If a custom URL is provided, use it directly
    if (customUrl) {
      document.body.style.backgroundImage = `url(${customUrl})`;
      document.body.classList.add('with-bg-image');
      return;
    }
    
    // Otherwise fetch from Firestore
    db.collection('settings').doc('appearance').get()
      .then(doc => {
        if (doc.exists && doc.data().backgroundImage) {
          document.body.style.backgroundImage = `url(${doc.data().backgroundImage})`;
          document.body.classList.add('with-bg-image');
          console.log("Applied background from Firestore:", doc.data().backgroundImage);
        } else {
          document.body.style.backgroundImage = '';
          document.body.classList.remove('with-bg-image');
          console.log("No background image found in Firestore");
        }
      })
      .catch(error => {
        console.error("Error getting background image:", error);
      });
  }
  
  // Helper function to escape HTML to prevent XSS
  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  
  // Load background image on page load
  applyBackgroundImage();
});

        

  
  

