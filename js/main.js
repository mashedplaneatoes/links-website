document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase
  const db = firebase.firestore();
  
  // Get DOM elements
  const linksContainer = document.getElementById('links-container');
  const searchInput = document.getElementById('search-input');
  const suggestionForm = document.getElementById('suggestion-form');
  
  // Store passwords that have been entered correctly
  const unlockedFolders = new Set();
  
  // Load links from Firestore
  function loadLinks() {
    db.collection('links')
      .where('visible', '==', true)
      .get()
      .then(snapshot => {
        // Process links
        const links = [];
        snapshot.forEach(doc => {
          const link = doc.data();
          link.id = doc.id;
          links.push(link);
        });
        
        // Organize links by folder and subfolder
        const folders = {};
        const noFolderLinks = [];
        
        links.forEach(link => {
          if (link.folder) {
            if (!folders[link.folder]) {
              folders[link.folder] = {
                name: link.folder,
                subfolders: {},
                links: [],
                hasPassword: !!link.password,
                password: link.password || null
              };
            } else if (link.password && !folders[link.folder].hasPassword) {
              // If this link has a password and the folder doesn't have one yet, set it
              folders[link.folder].hasPassword = true;
              folders[link.folder].password = link.password;
            }
            
            if (link.subfolder) {
              if (!folders[link.folder].subfolders[link.subfolder]) {
                folders[link.folder].subfolders[link.subfolder] = {
                  name: link.subfolder,
                  links: []
                };
              }
              folders[link.folder].subfolders[link.subfolder].links.push(link);
            } else {
              folders[link.folder].links.push(link);
            }
          } else {
            noFolderLinks.push(link);
          }
        });
        
        // Clear links container
        linksContainer.innerHTML = '';
        
        // Add folders
        Object.values(folders).forEach(folder => {
          const folderElement = document.createElement('div');
          folderElement.className = 'folder';
          
          const folderHeader = document.createElement('div');
          folderHeader.className = 'folder-header';
          folderHeader.innerHTML = `
            <span class="folder-name">${folder.name}</span>
            <span class="folder-arrow">▶</span>
          `;
          
          const folderContent = document.createElement('div');
          folderContent.className = 'folder-content hidden';
          
          // Check if folder is password protected
          const isPasswordProtected = folder.hasPassword;
          const isUnlocked = unlockedFolders.has(folder.name);
          
          // Toggle folder content visibility when header is clicked
          folderHeader.addEventListener('click', () => {
            const thisContent = folderHeader.nextElementSibling;
            const thisArrow = folderHeader.querySelector('.folder-arrow');
            
            thisContent.classList.toggle('hidden');
            thisArrow.textContent = thisContent.classList.contains('hidden') ? '▶' : '▼';
            
            // If this is the first time opening a password-protected folder that's not unlocked,
            // show the password form and don't render the actual content yet
            if (isPasswordProtected && !isUnlocked && thisContent.children.length === 0) {
              renderPasswordForm(folder, thisContent);
            }
          });
          
          // If the folder is already unlocked or not password protected, render its contents
          if (!isPasswordProtected || isUnlocked) {
            renderFolderContents(folder, folderContent);
          }
          
          folderElement.appendChild(folderHeader);
          folderElement.appendChild(folderContent);
          linksContainer.appendChild(folderElement);
        });
        
        // Add links with no folder
        if (noFolderLinks.length > 0) {
          const noFolderSection = document.createElement('div');
          noFolderSection.className = 'no-folder-section';
          
          noFolderLinks.forEach(link => {
            const linkElement = createLinkElement(link);
            noFolderSection.appendChild(linkElement);
          });
          
          linksContainer.appendChild(noFolderSection);
        }
        
        // Initialize search functionality
        initSearch();
      })
      .catch(error => {
        console.error('Error loading links:', error);
        linksContainer.innerHTML = '<p class="error-message">Error loading links. Please try again later.</p>';
      });
  }
  
  // Function to render password form
  function renderPasswordForm(folder, folderContent) {
    // Clear any existing content
    folderContent.innerHTML = '';
    
    // Create password form
    const passwordForm = document.createElement('div');
    passwordForm.className = 'password-form';
    passwordForm.innerHTML = `
      <p>This folder is password protected</p>
      <div class="password-input-group">
        <input type="password" class="folder-password-input" placeholder="Enter password">
        <button type="button" class="unlock-button">Unlock</button>
      </div>
      <p class="password-error hidden">Incorrect password</p>
    `;
    
    folderContent.appendChild(passwordForm);
    
    // Add unlock button event listener
    const unlockButton = passwordForm.querySelector('.unlock-button');
    const passwordInput = passwordForm.querySelector('.folder-password-input');
    const passwordError = passwordForm.querySelector('.password-error');
    
    unlockButton.addEventListener('click', () => {
      const enteredPassword = passwordInput.value.trim();
      
      if (enteredPassword === folder.password) {
        // Password correct, show folder contents
        unlockedFolders.add(folder.name);
        folderContent.innerHTML = ''; // Clear password form
        renderFolderContents(folder, folderContent);
      } else {
        // Password incorrect, show error
        passwordError.classList.remove('hidden');
      }
    });
    
    // Also allow pressing Enter to submit
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        unlockButton.click();
      }
    });
  }
  
  // Helper function to render folder contents
  function renderFolderContents(folder, folderContent) {
    // Add folder links
    folder.links.forEach(link => {
      const linkElement = createLinkElement(link);
      folderContent.appendChild(linkElement);
    });
    
    // Add subfolders
    Object.values(folder.subfolders).forEach(subfolder => {
      const subfolderElement = document.createElement('div');
      subfolderElement.className = 'subfolder';
      
      const subfolderHeader = document.createElement('div');
      subfolderHeader.className = 'subfolder-header';
      subfolderHeader.innerHTML = `
        <span class="subfolder-name">${subfolder.name}</span>
        <span class="subfolder-arrow">▶</span>
      `;
      
      const subfolderContent = document.createElement('div');
      subfolderContent.className = 'subfolder-content hidden';
      
      // Add subfolder links
      subfolder.links.forEach(link => {
        const linkElement = createLinkElement(link);
        subfolderContent.appendChild(linkElement);
      });
      
      // Toggle ONLY THIS subfolder's content visibility when header is clicked
      subfolderHeader.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent triggering parent folder toggle
        
        // Get THIS specific subfolder's content and arrow
        const thisSubfolderContent = subfolderHeader.nextElementSibling;
        const thisSubfolderArrow = subfolderHeader.querySelector('.subfolder-arrow');
        
        thisSubfolderContent.classList.toggle('hidden');
        thisSubfolderArrow.textContent = thisSubfolderContent.classList.contains('hidden') ? '▶' : '▼';
      });
      
      subfolderElement.appendChild(subfolderHeader);
      subfolderElement.appendChild(subfolderContent);
      folderContent.appendChild(subfolderElement);
    });
  }
  
  // Helper function to create a link element
  function createLinkElement(link) {
    const linkElement = document.createElement('div');
    linkElement.className = 'link-item';
    linkElement.innerHTML = `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-name">${link.name}</a>
    `;
    return linkElement;
  }
  
  // Initialize search functionality
  function initSearch() {
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
      const searchTerm = searchInput.value.trim().toLowerCase();
      
      // Get all link items
      const linkItems = document.querySelectorAll('.link-item');
      
      // Get all folders and subfolders
      const folders = document.querySelectorAll('.folder');
      const subfolders = document.querySelectorAll('.subfolder');
      
      if (searchTerm === '') {
        // If search is empty, reset everything
        linkItems.forEach(item => {
          item.style.display = '';
        });
        
        folders.forEach(folder => {
          folder.style.display = '';
          folder.querySelector('.folder-content').classList.add('hidden');
          folder.querySelector('.folder-arrow').textContent = '▶';
        });
        
        subfolders.forEach(subfolder => {
          subfolder.style.display = '';
          subfolder.querySelector('.subfolder-content').classList.add('hidden');
          subfolder.querySelector('.subfolder-arrow').textContent = '▶';
        });
      } else {
        // Filter links
        let hasVisibleLinks = false;
        
        linkItems.forEach(item => {
          const linkName = item.querySelector('.link-name').textContent.toLowerCase();
          if (linkName.includes(searchTerm)) {
            item.style.display = '';
            hasVisibleLinks = true;
            
            // Show parent folder and subfolder
            const parentSubfolder = item.closest('.subfolder');
            const parentFolder = item.closest('.folder');
            
            if (parentSubfolder) {
              parentSubfolder.style.display = '';
              parentSubfolder.querySelector('.subfolder-content').classList.remove('hidden');
              parentSubfolder.querySelector('.subfolder-arrow').textContent = '▼';
            }
            
            if (parentFolder) {
              parentFolder.style.display = '';
              parentFolder.querySelector('.folder-content').classList.remove('hidden');
              parentFolder.querySelector('.folder-arrow').textContent = '▼';
            }
          } else {
            item.style.display = 'none';
          }
        });
        
        // Hide empty folders and subfolders
        folders.forEach(folder => {
          const folderContent = folder.querySelector('.folder-content');
          const visibleLinks = Array.from(folderContent.querySelectorAll('.link-item')).filter(link => link.style.display !== 'none');
          const visibleSubfolders = Array.from(folderContent.querySelectorAll('.subfolder')).filter(subfolder => subfolder.style.display !== 'none');
          
          if (visibleLinks.length === 0 && visibleSubfolders.length === 0) {
            folder.style.display = 'none';
          }
        });
      }
    });
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
      const description = descriptionInput.value.trim();
      const imageUrl = imageUrlInput.value.trim();
      
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
  
  // Load links when page loads
  loadLinks();
});
