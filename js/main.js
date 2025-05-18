document.addEventListener('DOMContentLoaded', () => {
  // Initialize Firebase
  const db = firebase.firestore();
  
  // Get DOM elements
  const linksContainer = document.getElementById('links-container');
  const searchInput = document.getElementById('search-input');
  const suggestionForm = document.getElementById('suggestion-form');
  
  // Function to load links
  function loadLinks() {
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
          
          // Create a shortened URL for display
          const urlObj = new URL(link.url);
          const displayUrl = urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
          
          linkCard.innerHTML = `
            <h3>${link.name}</h3>
            <div class="link-url-container">
              <span class="link-url">${displayUrl}</span>
              <button class="copy-button" title="Copy URL to clipboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <a href="${link.url}" target="_blank" rel="noopener noreferrer">View Link</a>
          `;
          
          // Add password protection if needed
          if (link.password) {
            const viewLink = linkCard.querySelector('a');
            const passwordProtected = document.createElement('div');
            passwordProtected.className = 'password-protected';
            passwordProtected.innerHTML = '<p>This link is password protected</p>';
            
            const passwordForm = document.createElement('div');
            passwordForm.className = 'password-form hidden';
            passwordForm.innerHTML = `
              <input type="password" placeholder="Enter password" class="password-input">
              <button class="unlock-button">Unlock</button>
              <p class="password-error hidden">Incorrect password</p>
            `;
            
            passwordProtected.addEventListener('click', () => {
              passwordForm.classList.toggle('hidden');
            });
            
            const unlockButton = passwordForm.querySelector('.unlock-button');
            const passwordInput = passwordForm.querySelector('.password-input');
            const passwordError = passwordForm.querySelector('.password-error');
            
            unlockButton.addEventListener('click', () => {
              const enteredPassword = passwordInput.value.trim();
              
              if (enteredPassword === link.password) {
                window.open(link.url, '_blank');
                passwordForm.classList.add('hidden');
                passwordInput.value = '';
                passwordError.classList.add('hidden');
              } else {
                passwordError.classList.remove('hidden');
              }
            });
            
            viewLink.addEventListener('click', (e) => {
              e.preventDefault();
              passwordForm.classList.remove('hidden');
            });
            
            linkCard.appendChild(passwordProtected);
            linkCard.appendChild(passwordForm);
          }
          
          // Add copy button functionality
          const copyButton = linkCard.querySelector('.copy-button');
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
          
          linksContainer.appendChild(linkCard);
        });
      })
      .catch(error => {
        console.error('Error loading links:', error);
        linksContainer.innerHTML = '<p class="error-message">Error loading links. Please try again later.</p>';
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
  
  // Load links when page loads
  loadLinks();
});
