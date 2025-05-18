document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase
  const db = firebase.firestore();
  
  // Get DOM elements
  const loginForm = document.getElementById('login-form');
  const adminPanel = document.getElementById('admin-panel');
  const passwordInput = document.getElementById('password-input');
  const passwordError = document.getElementById('password-error');
  const linksTab = document.getElementById('links-tab');
  const suggestionsTab = document.getElementById('suggestions-tab');
  const linksContent = document.getElementById('links-content');
  const suggestionsContent = document.getElementById('suggestions-content');
  const logoutButton = document.getElementById('logout-button');
  
  // Admin password (in a real app, this would be handled server-side)
  const adminPassword = 'admin123';
  
  // Check if admin is already logged in
  const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  
  if (isLoggedIn) {
    showAdminPanel();
  } else {
    showLoginForm();
  }
  
  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const password = passwordInput.value.trim();
      
      if (password === adminPassword) {
        // Store login state in localStorage
        localStorage.setItem('adminLoggedIn', 'true');
        
        // Show admin panel
        showAdminPanel();
      } else {
        // Show error message
        passwordError.classList.remove('hidden');
      }
    });
  }
  
  // Handle logout
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      // Clear login state
      localStorage.removeItem('adminLoggedIn');
      
      // Show login form
      showLoginForm();
    });
  }
  
  // Handle tab switching
  if (linksTab && suggestionsTab) {
    linksTab.addEventListener('click', () => {
      linksTab.classList.add('active');
      suggestionsTab.classList.remove('active');
      linksContent.classList.remove('hidden');
      suggestionsContent.classList.add('hidden');
    });
    
    suggestionsTab.addEventListener('click', () => {
      suggestionsTab.classList.add('active');
      linksTab.classList.remove('active');
      suggestionsContent.classList.remove('hidden');
      linksContent.classList.add('hidden');
    });
  }
  
  // Function to show login form
  function showLoginForm() {
    if (loginForm && adminPanel) {
      loginForm.classList.remove('hidden');
      adminPanel.classList.add('hidden');
      
      // Clear password input and error message
      if (passwordInput) {
        passwordInput.value = '';
      }
      if (passwordError) {
        passwordError.classList.add('hidden');
      }
    }
  }
  
  // Function to show admin panel
  function showAdminPanel() {
    if (loginForm && adminPanel) {
      loginForm.classList.add('hidden');
      adminPanel.classList.remove('hidden');
      
      // Load links and suggestions
      loadLinks();
      loadSuggestions();
    }
  }
  
  // Function to load links
  function loadLinks() {
    const linksContainer = document.getElementById('links-list');
    
    if (!linksContainer) return;
    
    // Clear links container
    linksContainer.innerHTML = '<p class="loading-message">Loading links...</p>';
    
    // Get links from Firestore
    db.collection('links')
      .get()
      .then(snapshot => {
        // Clear loading message
        linksContainer.innerHTML = '';
        
        if (snapshot.empty) {
          linksContainer.innerHTML = '<p class="empty-message">No links found.</p>';
          return;
        }
        
        // Process links
        snapshot.forEach(doc => {
          const link = doc.data();
          link.id = doc.id;
          
          const linkElement = createLinkElement(link);
          linksContainer.appendChild(linkElement);
        });
      })
      .catch(error => {
        console.error('Error loading links:', error);
        linksContainer.innerHTML = '<p class="error-message">Error loading links. Please try again later.</p>';
      });
  }
  
  // Function to load suggestions
  function loadSuggestions() {
    const suggestionsContainer = document.getElementById('suggestions-list');
    
    if (!suggestionsContainer) return;
    
    // Clear suggestions container
    suggestionsContainer.innerHTML = '<p class="loading-message">Loading suggestions...</p>';
    
    // Get suggestions from Firestore
    db.collection('suggestions')
      .orderBy('createdAt', 'desc')
      .get()
      .then(snapshot => {
        // Clear loading message
        suggestionsContainer.innerHTML = '';
        
        if (snapshot.empty) {
          suggestionsContainer.innerHTML = '<p class="empty-message">No suggestions found.</p>';
          return;
        }
        
        // Process suggestions
        snapshot.forEach(doc => {
          const suggestion = doc.data();
          suggestion.id = doc.id;
          
          const suggestionElement = createSuggestionElement(suggestion);
          suggestionsContainer.appendChild(suggestionElement);
        });
      })
      .catch(error => {
        console.error('Error loading suggestions:', error);
        suggestionsContainer.innerHTML = '<p class="error-message">Error loading suggestions. Please try again later.</p>';
      });
  }
  
  // Function to create a link element
  function createLinkElement(link) {
    const linkElement = document.createElement('div');
    linkElement.className = 'admin-list-item';
    
    // Create link content
    linkElement.innerHTML = `
      <h4>${link.name}</h4>
      <p><strong>URL:</strong> <a href="${link.url}" target="_blank">${link.url}</a></p>
      <p><strong>Folder:</strong> ${link.folder || 'None'}</p>
      <p><strong>Subfolder:</strong> ${link.subfolder || 'None'}</p>
      <p><strong>Visible:</strong> ${link.visible ? 'Yes' : 'No'}</p>
      <div class="admin-actions">
        <button class="edit-button" data-id="${link.id}">Edit</button>
        <button class="delete-button" data-id="${link.id}">Delete</button>
      </div>
    `;
    
    // Add event listeners
    const editButton = linkElement.querySelector('.edit-button');
    const deleteButton = linkElement.querySelector('.delete-button');
    
    editButton.addEventListener('click', () => {
      // Create edit form
      const editForm = document.createElement('div');
      editForm.className = 'edit-form';
      editForm.innerHTML = `
        <div class="form-group">
          <label for="edit-name-${link.id}">Name</label>
          <input type="text" id="edit-name-${link.id}" value="${link.name}" required>
        </div>
        <div class="form-group">
          <label for="edit-url-${link.id}">URL</label>
          <input type="url" id="edit-url-${link.id}" value="${link.url}" required>
        </div>
        <div class="form-group">
          <label for="edit-folder-${link.id}">Folder</label>
          <input type="text" id="edit-folder-${link.id}" value="${link.folder || ''}">
        </div>
        <div class="form-group">
          <label for="edit-subfolder-${link.id}">Subfolder</label>
          <input type="text" id="edit-subfolder-${link.id}" value="${link.subfolder || ''}">
        </div>
        <div class="form-group">
          <label for="edit-password-${link.id}">Password (for folder)</label>
          <input type="text" id="edit-password-${link.id}" value="${link.password || ''}">
        </div>
        <div class="form-group checkbox">
          <input type="checkbox" id="edit-visible-${link.id}" ${link.visible ? 'checked' : ''}>
          <label for="edit-visible-${link.id}">Visible</label>
        </div>
        <div class="admin-actions">
          <button class="save-button" data-id="${link.id}">Save</button>
          <button class="cancel-button">Cancel</button>
        </div>
      `;
      
      // Add event listeners to edit form buttons
      const saveButton = editForm.querySelector('.save-button');
      const cancelButton = editForm.querySelector('.cancel-button');
      
      saveButton.addEventListener('click', () => {
        // Get updated values
        const updatedLink = {
          name: document.getElementById(`edit-name-${link.id}`).value.trim(),
          url: document.getElementById(`edit-url-${link.id}`).value.trim(),
          folder: document.getElementById(`edit-folder-${link.id}`).value.trim() || null,
          subfolder: document.getElementById(`edit-subfolder-${link.id}`).value.trim() || null,
          password: document.getElementById(`edit-password-${link.id}`).value.trim() || null,
          visible: document.getElementById(`edit-visible-${link.id}`).checked
        };
        
        // Update link in Firestore
        db.collection('links').doc(link.id).update(updatedLink)
          .then(() => {
            // Remove edit form
            editForm.remove();
            
            // Reload links
            loadLinks();
          })
          .catch(error => {
            console.error('Error updating link:', error);
            alert('Error updating link. Please try again later.');
          });
      });
      
      cancelButton.addEventListener('click', () => {
        // Remove edit form
        editForm.remove();
      });
      
      // Add edit form after link element
      linkElement.after(editForm);
    });
    
    deleteButton.addEventListener('click', () => {
      // Confirm deletion
      if (confirm('Are you sure you want to delete this link?')) {
        // Delete link from Firestore
        db.collection('links').doc(link.id).delete()
          .then(() => {
            // Remove link element
            linkElement.remove();
          })
          .catch(error => {
            console.error('Error deleting link:', error);
            alert('Error deleting link. Please try again later.');
          });
      }
    });
    
    return linkElement;
  }
  
  // Function to create a suggestion element
  function createSuggestionElement(suggestion) {
    const suggestionElement = document.createElement('div');
    suggestionElement.className = 'admin-list-item';
    
    // Create suggestion content
    suggestionElement.innerHTML = `
      <h4>${suggestion.name}</h4>
      <p><strong>URL:</strong> <a href="${suggestion.url}" target="_blank">${suggestion.url}</a></p>
      ${suggestion.description ? `<p><strong>Description:</strong> ${suggestion.description}</p>` : ''}
      ${suggestion.imageUrl ? `<p><strong>Image URL:</strong> <a href="${suggestion.imageUrl}" target="_blank">${suggestion.imageUrl}</a></p>` : ''}
      <p><strong>Submitted:</strong> ${suggestion.createdAt ? new Date(suggestion.createdAt.toDate()).toLocaleString() : 'Unknown'}</p>
      <div class="admin-actions">
        <button class="approve-button" data-id="${suggestion.id}">Approve</button>
        <button class="delete-button" data-id="${suggestion.id}">Delete</button>
      </div>
    `;
    
    // Add event listeners
    const approveButton = suggestionElement.querySelector('.approve-button');
    const deleteButton = suggestionElement.querySelector('.delete-button');
    
    approveButton.addEventListener('click', () => {
      // Create link from suggestion
      const newLink = {
        name: suggestion.name,
        url: suggestion.url,
        description: suggestion.description || null,
        imageUrl: suggestion.imageUrl || null,
        folder: null,
        subfolder: null,
        visible: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add link to Firestore
      db.collection('links').add(newLink)
        .then(() => {
          // Delete suggestion
          return db.collection('suggestions').doc(suggestion.id).delete();
        })
        .then(() => {
          // Remove suggestion element
          suggestionElement.remove();
          
          // Reload links
          loadLinks();
        })
        .catch(error => {
          console.error('Error approving suggestion:', error);
          alert('Error approving suggestion. Please try again later.');
        });
    });
    
    deleteButton.addEventListener('click', () => {
      // Confirm deletion
      if (confirm('Are you sure you want to delete this suggestion?')) {
        // Delete suggestion from Firestore
        db.collection('suggestions').doc(suggestion.id).delete()
          .then(() => {
            // Remove suggestion element
            suggestionElement.remove();
          })
          .catch(error => {
            console.error('Error deleting suggestion:', error);
            alert('Error deleting suggestion. Please try again later.');
          });
      }
    });
    
    return suggestionElement;
  }
  
  // Add new link form
  const addLinkForm = document.getElementById('add-link-form');
  
  if (addLinkForm) {
    addLinkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('add-name').value.trim();
      const url = document.getElementById('add-url').value.trim();
      const folder = document.getElementById('add-folder').value.trim();
      const subfolder = document.getElementById('add-subfolder').value.trim();
      const password = document.getElementById('add-password').value.trim();
      const visible = document.getElementById('add-visible').checked;
      
      // Create new link
      const newLink = {
        name,
        url,
        folder: folder || null,
        subfolder: subfolder || null,
        password: password || null,
        visible,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      // Add link to Firestore
      db.collection('links').add(newLink)
        .then(() => {
          // Reset form
          addLinkForm.reset();
          
          // Reload links
          loadLinks();
        })
        .catch(error => {
          console.error('Error adding link:', error);
          alert('Error adding link. Please try again later.');
        });
    });
  }
});
