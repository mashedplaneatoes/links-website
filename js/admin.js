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
    const password = document.getElementById('link-password').value.trim();
    const visible = document.getElementById('link-visible').checked;
    
    try {
      // Add link to Firestore
      await db.collection('links').add({
        name,
        url,
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

// Hide error message initially
document.addEventListener('DOMContentLoaded', () => {
  const loginError = document.getElementById('login-error');
  if (loginError) {
    loginError.style.display = 'none';
  }
});

  // Function to show login form
  function showLoginForm() {
    loginSection.classList.remove('hidden');
    adminDashboard.classList.add('hidden');
    isAdmin = false;
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
            ${link.name}
            <span class="status-badge">${link.visible ? 'Visible' : 'Hidden'}</span>
          </h4>
          <p>URL: <a href="${link.url}" target="_blank">${link.url}</a></p>
          <p>Password: ${link.password ? link.password : 'None'}</p>
          
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
          <h4>${suggestion.name}</h4>
          <p>URL: <a href="${suggestion.url}" target="_blank">${suggestion.url}</a></p>
          ${suggestion.description ? `<p>Description: ${suggestion.description}</p>` : ''}
          ${suggestion.imageUrl ? `<p>Image URL: <a href="${suggestion.imageUrl}" target="_blank">View Image</a></p>` : ''}
          
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
  
  // Function to edit a link
  window.editLink = function(linkId) {
    if (!isAdmin) return;
    
    const listItem = document.querySelector(`.admin-list-item:has(button[onclick="editLink('${linkId}')"])`);
    
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
 // Function to save edited link
  window.saveLink = function(linkId) {
    if (!isAdmin) return;
    
    const name = document.getElementById(`edit-name-${linkId}`).value.trim();
    const url = document.getElementById(`edit-url-${linkId}`).value.trim();
    const password = document.getElementById(`edit-password-${linkId}`).value.trim();
    const visible = document.getElementById(`edit-visible-${linkId}`).checked;
    
    if (!name || !url) {
      alert('Name and URL are required');
      return;
    }
    
    db.collection('links').doc(linkId).update({
      name,
      url,
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
  };
  
  // Function to cancel edit
  window.cancelEdit = function(linkId) {
    const listItem = document.querySelector(`.admin-list-item:has(button[onclick="saveLink('${linkId}')"])`);
    
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
  
  // Function to delete a link
  window.deleteLink = function(linkId) {
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
  };
  
  // Function to approve a suggestion
  window.approveSuggestion = function(suggestionId) {
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
  };
  
  // Function to delete a suggestion
  window.deleteSuggestion = function(suggestionId) {
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
  };
});
