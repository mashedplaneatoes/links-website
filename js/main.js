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
  const linksContainer = document.getElementById('links-container');
  const searchInput = document.getElementById('search-input');
  const suggestionForm = document.getElementById('suggestion-form');
  
  // Initialize Firebase
  const db = firebase.firestore();
  
  // Hide the login error initially
  if (loginError) {
    loginError.style.display = 'none';
  }
  
  // Admin authentication state
  let isAdmin = false;
  
  // Check if admin is already logged in
  checkAdminStatus();
  
  // Handle login form submission
  if (loginForm) {
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
          
          // Show background image controls for admin
          showBackgroundImageControls();
        } else {
          showLoginError('Incorrect password');
        }
      } catch (error) {
        console.error("Login error:", error);
        showLoginError('Error logging in. Please try again.');
      }
    });
  }
  
  // Handle logout
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('isAdmin');
      showLoginForm();
      
      // Hide background image controls when logging out
      const bgControls = document.querySelector('.bg-image-controls');
      if (bgControls) {
        bgControls.remove();
      }
    });
  }
  
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
  if (addLinkForm) {
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
  }
  
  // Function to check admin status
  function checkAdminStatus() {
    const adminStatus = localStorage.getItem('isAdmin');
    
    if (adminStatus === 'true') {
      isAdmin = true;
      showAdminDashboard();
      loadLinks();
      loadSuggestions();
      
      // Show background image controls for admin
      showBackgroundImageControls();
    } else {
      isAdmin = false;
      if (loginSection) {
        showLoginForm();
      }
    }
    
    // Load links for public view
    if (linksContainer) {
      loadPublicLinks();
    }
    
    // Apply background image if set
    applyBackgroundImage();
  }
  
  // Function to show login error
  function showLoginError(message) {
    if (loginError) {
      loginError.textContent = message;
      loginError.style.display = 'block';
    }
  }
  
  // Function to show login form
  function showLoginForm() {
    if (loginSection && adminDashboard) {
      loginSection.classList.remove('hidden');
      adminDashboard.classList.add('hidden');
      isAdmin = false;
      
      // Hide login error when showing the form
      if (loginError) {
        loginError.style.display = 'none';
      }
    }
  }
  
  // Function to show admin dashboard
  function showAdminDashboard() {
    if (loginSection && adminDashboard) {
      loginSection.classList.add('hidden');
      adminDashboard.classList.remove('hidden');
      isAdmin = true;
    }
  }
  
  // Function to load links for admin
  async function loadLinks() {
    if (!isAdmin || !linksList) return;
    
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
            <span class="status-badge ${link.visible ? 'visible' : 'hidden'}">${link.visible ? 'Visible' : 'Hidden'}</span>
          </h4>
          <p>URL: <a href="${link.url}" target="_blank">${link.url}</a></p>
          ${link.folder ? `<p>Folder: ${link.folder}</p>` : ''}
          ${link.subfolder ? `<p>Subfolder: ${link.subfolder}</p>` : ''}
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
  
  // Function to load public links
  function loadPublicLinks() {
    if (!linksContainer) return;
    
    linksContainer.innerHTML = '<p class="loading-message">Loading links...</p>';
    
    db.collection('links')
      .where('visible', '==', true)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          linksContainer.innerHTML = '<p>No links available.</p>';
          return;
        }
        
        linksContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
          const link = doc.data();
          const linkId = doc.id;
          
          // Create link card
          const linkCard = document.createElement('div');
          linkCard.className = 'link-card';
          
          // Create content based on whether the link is password protected
          let cardContent = '';
          
          if (link.password) {
            // For password protected links, don't show the URL at all
            cardContent = `
              <h3>${link.name}</h3>
              <div class="password-protected">
                <p>This link is password protected</p>
              </div>
            `;
          } else {
            // For non-password protected links, show URL and copy button
            const urlObj = new URL(link.url);
            const displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
            
            cardContent = `
              <h3>${link.name}</h3>
              <div class="link-url-container">
                <span class="link-url">${displayUrl}</span>
                <button class="copy-button" title="Copy URL to clipboard" data-url="${link.url}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
              <a href="${link.url}" target="_blank" rel="noopener noreferrer">View Link</a>
            `;
          }
          
          linkCard.innerHTML = cardContent;
          
          // Add password protection if needed
          if (link.password) {
            const passwordForm = document.createElement('div');
            passwordForm.className = 'password-form hidden';
            passwordForm.innerHTML = `
              <input type="password" placeholder="Enter password" class="password-input">
              <button class="unlock-button">Unlock</button>
              <p class="password-error hidden">Incorrect password</p>
            `;
            
            const passwordProtected = linkCard.querySelector('.password-protected');
            passwordProtected.addEventListener('click', () => {
              passwordForm.classList.toggle('hidden');
            });
            
            const unlockButton = passwordForm.querySelector('.unlock-button');
            const passwordInput = passwordForm.querySelector('.password-input');
            const passwordError = passwordForm.querySelector('.password-error');
            
            unlockButton.addEventListener('click', () => {
              const enteredPassword = passwordInput.value.trim();
              
              if (enteredPassword === link.password) {
                // Password correct - now reveal the URL and copy button
                passwordForm.classList.add('hidden');
                passwordInput.value = '';
                passwordError.classList.add('hidden');
                
                // Remove the password protected message
                passwordProtected.remove();
                passwordForm.remove();
                
                // Create URL display and copy button
                const urlObj = new URL(link.url);
                const displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
                
                const urlContainer = document.createElement('div');
                urlContainer.className = 'link-url-container';
                urlContainer.innerHTML = `
                  <span class="link-url">${displayUrl}</span>
                  <button class="copy-button" title="Copy URL to clipboard" data-url="${link.url}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                  </button>
                `;
                
                // Add view link
                const viewLink = document.createElement('a');
                viewLink.href = link.url;
                viewLink.target = "_blank";
                viewLink.rel = "noopener noreferrer";
                viewLink.textContent = "View Link";
                
                // Add the elements to the card
                linkCard.appendChild(urlContainer);
                linkCard.appendChild(viewLink);
                
                // Add copy button functionality
                const copyButton = urlContainer.querySelector('.copy-button');
                copyButton.addEventListener('click', () => {
                  navigator.clipboard.writeText(link.url)
                    .then(() => {
                      // Show temporary success message
                      const originalTitle = copyButton.getAttribute('title');
                      copyButton.setAttribute('title', 'Copied!');
                      copyButton.classList.add('copied');
                      
                      // Reset after 2 seconds
                      setTimeout(() => {
                        copyButton.setAttribute('title', originalTitle);
                        copyButton.classList.remove('copied');
                      }, 2000);
                    })
                    .catch(err => {
                      console.error('Could not copy text: ', err);
                    });
                });
              } else {
                passwordError.classList.remove('hidden');
              }
            });
            
            // Allow pressing Enter to submit password
            passwordInput.addEventListener('keypress', (e) => {
              if (e.key === 'Enter') {
                unlockButton.click();
              }
            });
            
            linkCard.appendChild(passwordForm);
          } else {
            // Add copy button functionality for non-password protected links
            const copyButton = linkCard.querySelector('.copy-button');
            copyButton.addEventListener('click', () => {
              const url = copyButton.getAttribute('data-url');
              navigator.clipboard.writeText(url)
                .then(() => {
                  // Show temporary success message
                  const originalTitle = copyButton.getAttribute('title');
                  copyButton.setAttribute('title', 'Copied!');
                  copyButton.classList.add('copied');
                  
                  // Reset after 2 seconds
                  setTimeout(() => {
                    copyButton.setAttribute('title', originalTitle);
                    copyButton.classList.remove('copied');
                  }, 2000);
                })
                .catch(err => {
                  console.error('Could not copy text: ', err);
                });
            });
          }
          
                    linksContainer.appendChild(linkCard);
        });
        
        // Add search functionality
        if (searchInput) {
          searchInput.addEventListener('input', filterLinks);
        }
      })
      .catch(error => {
        console.error("Error loading public links:", error);
        linksContainer.innerHTML = '<p class="error-message">Error loading links. Please try again.</p>';
      });
  }
  
  // Function to filter links based on search input
  function filterLinks() {
    if (!searchInput || !linksContainer) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const linkCards = linksContainer.querySelectorAll('.link-card');
    
    linkCards.forEach(card => {
      const linkName = card.querySelector('h3').textContent.toLowerCase();
      const isVisible = linkName.includes(searchTerm);
      card.style.display = isVisible ? 'block' : 'none';
    });
    
    // Show message if no results
    const visibleCards = Array.from(linkCards).filter(card => card.style.display !== 'none');
    
    if (visibleCards.length === 0 && searchTerm !== '') {
      let noResultsElement = linksContainer.querySelector('.no-results');
      
      if (!noResultsElement) {
        noResultsElement = document.createElement('p');
        noResultsElement.className = 'no-results';
        linksContainer.appendChild(noResultsElement);
      }
      
      noResultsElement.textContent = `No links found matching "${searchTerm}"`;
      noResultsElement.style.display = 'block';
    } else {
      const noResultsElement = linksContainer.querySelector('.no-results');
      if (noResultsElement) {
        noResultsElement.style.display = 'none';
      }
    }
  }
  
  // Function to load suggestions
  async function loadSuggestions() {
    if (!isAdmin || !suggestionsList) return;
    
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
          ${suggestion.imageUrl ? `<p>Image URL: <a href="${suggestion.imageUrl}" target="_blank">${suggestion.imageUrl}</a></p>` : ''}
          <p>Submitted: ${suggestion.createdAt ? new Date(suggestion.createdAt.toDate()).toLocaleString() : 'Unknown'}</p>
          
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
  
 // Function to show background image controls for admin
function showBackgroundImageControls() {
  if (!isAdmin) return;
  
  // Check if controls already exist
  if (document.querySelector('.bg-image-controls')) return;
  
  // Create controls
  const controls = document.createElement('div');
  controls.className = 'bg-image-controls';
  controls.innerHTML = `
    <div class="bg-controls-header">
      <h4>Background Image</h4>
      <button id="minimize-bg-controls" class="minimize-button">×</button>
    </div>
    <div class="bg-controls-content">
      <input type="text" id="bg-image-url" placeholder="Enter image URL">
      <button id="apply-bg">Apply Background</button>
      <button id="remove-bg" class="remove-bg">Remove Background</button>
    </div>
  `;
  
  document.body.appendChild(controls);
  
  // Add CSS for minimized state
  const style = document.createElement('style');
  style.textContent = `
    .bg-image-controls.minimized .bg-controls-content {
      display: none;
    }
    .bg-controls-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .minimize-button {
      background: none;
      border: none;
      color: var(--text-color);
      font-size: 20px;
      cursor: pointer;
      padding: 0 5px;
      transform: none;
    }
    .minimize-button:hover {
      color: var(--secondary-color);
      background-color: transparent;
    }
  `;
  document.head.appendChild(style);
  
  // Add minimize functionality
  document.getElementById('minimize-bg-controls').addEventListener('click', () => {
    controls.classList.toggle('minimized');
    const button = document.getElementById('minimize-bg-controls');
    button.textContent = controls.classList.contains('minimized') ? '□' : '×';
  });
  
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
        alert('Error saving background image');
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
      alert('Error removing background image');
    });
  });
  
  // Allow pressing Enter to apply background
  document.getElementById('bg-image-url').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('apply-bg').click();
    }
  });
  
  // Save minimized state in localStorage
  controls.addEventListener('transitionend', () => {
    localStorage.setItem('bgControlsMinimized', controls.classList.contains('minimized'));
  });
  
  // Check if it was previously minimized
  const wasMinimized = localStorage.getItem('bgControlsMinimized') === 'true';
  if (wasMinimized) {
    controls.classList.add('minimized');
    document.getElementById('minimize-bg-controls').textContent = '□';
  }
}

  
  // Handle suggestion form submission
  if (suggestionForm) {
    suggestionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const nameInput = document.getElementById('suggestion-name');
      const urlInput = document.getElementById('suggestion-url');
      const descriptionInput = document.getElementById('suggestion-description');
      const imageUrlInput = document.getElementById('suggestion-image-url');
      
      const name = nameInput.value.trim();
      const url = urlInput.value.trim();
      const description = descriptionInput ? descriptionInput.value.trim() : '';
      const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';
      
      if (!name || !url) {
        alert('Please enter a name and URL for your suggestion.');
        return;
      }
      
      // Add suggestion to Firestore
      db.collection('suggestions').add({
        name,
        url,
        description: description || null,
        imageUrl: imageUrl || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      })
      .then(() => {
        // Reset form
        suggestionForm.reset();
        
        // Show success message
        alert('Thank you for your suggestion! It will be reviewed by the admin.');
      })
      .catch(error => {
        console.error('Error adding suggestion:', error);
        alert('Error submitting suggestion. Please try again later.');
      });
    });
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
            <label for="edit-folder-${linkId}">Folder:</label>
            <input type="text" id="edit-folder-${linkId}" value="${link.folder || ''}">
          </div>
          <div class="form-group">
            <label for="edit-subfolder-${linkId}">Subfolder:</label>
            <input type="text" id="edit-subfolder-${linkId}" value="${link.subfolder || ''}">
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
  
  
  // Load public links if on the main page
  if (linksContainer) {
    loadPublicLinks();
  }
  
  // Apply background image on page load
  applyBackgroundImage();
});

// Helper function to format dates
function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp.toDate();
  return new Date(date).toLocaleString();
}

// Helper function to validate URLs
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper function to create folder structure
function createFolderStructure(links) {
  const folders = {};
  
  // Group links by folder and subfolder
  links.forEach(link => {
    const folder = link.folder || 'Uncategorized';
    const subfolder = link.subfolder || 'General';
    
    if (!folders[folder]) {
      folders[folder] = {};
    }
    
    if (!folders[folder][subfolder]) {
      folders[folder][subfolder] = [];
    }
    
    folders[folder][subfolder].push(link);
  });
  
  return folders;
}

// Function to toggle dark/light mode
function toggleDarkMode() {
  const body = document.body;
  const isDarkMode = body.classList.contains('dark-mode');
  
  if (isDarkMode) {
    body.classList.remove('dark-mode');
    localStorage.setItem('darkMode', 'false');
  } else {
    body.classList.add('dark-mode');
    localStorage.setItem('darkMode', 'true');
  }
}

// Check for dark mode preference on page load
function checkDarkModePreference() {
  const darkModePreference = localStorage.getItem('darkMode');
  
  if (darkModePreference === 'true') {
    document.body.classList.add('dark-mode');
  } else if (darkModePreference === null) {
    // Check system preference if no stored preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('darkMode', 'true');
    }
  }
}

// Call dark mode check on page load
checkDarkModePreference();

            
