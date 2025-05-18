document.addEventListener('DOMContentLoaded', () => {
  const linksContainer = document.getElementById('links-container');
  
  // Function to fetch and display links
  async function loadLinks() {
    try {
      // Get links from Firestore
      const snapshot = await db.collection('links')
        .where('visible', '==', true)
        .get();
      
      if (snapshot.empty) {
        linksContainer.innerHTML = '<p>No links available.</p>';
        return;
      }
      
      // Clear loading message
      linksContainer.innerHTML = '';
      
      // Display each link
      snapshot.forEach(doc => {
        const link = doc.data();
        const linkId = doc.id;
        
        const linkElement = document.createElement('div');
        linkElement.className = 'link-card';
        
        if (link.password) {
          // Password protected link
          linkElement.innerHTML = `
            <h3>${link.name}</h3>
            <p class="password-protected">🔒 This link is password protected</p>
            <div class="password-form">
              <input type="password" placeholder="Enter password" id="password-${linkId}" class="password-input">
              <button onclick="unlockLink('${linkId}')">Unlock</button>
            </div>
          `;
        } else {
          // Regular link
          linkElement.innerHTML = `
            <h3>${link.name}</h3>
            <a href="${link.url}" target="_blank">Visit Link</a>
          `;
        }
        
        linksContainer.appendChild(linkElement);
      });
    } catch (error) {
      console.error("Error loading links:", error);
      linksContainer.innerHTML = '<p class="error-message">Error loading links. Please try again later.</p>';
    }
  }
  
  // Function to unlock password-protected links
  window.unlockLink = async function(linkId) {
    const passwordInput = document.getElementById(`password-${linkId}`);
    const password = passwordInput.value.trim();
    
    if (!password) {
      alert('Please enter a password');
      return;
    }
    
    try {
      const doc = await db.collection('links').doc(linkId).get();
      
      if (!doc.exists) {
        alert('Link not found');
        return;
      }
      
      const link = doc.data();
      
      if (password === link.password) {
        // Password is correct, show the link
        const linkCard = passwordInput.closest('.link-card');
        linkCard.innerHTML = `
          <h3>${link.name}</h3>
          <a href="${link.url}" target="_blank">Visit Link</a>
        `;
      } else {
        alert('Incorrect password');
      }
    } catch (error) {
      console.error("Error unlocking link:", error);
      alert('Error unlocking link. Please try again.');
    }
  };
  
  // Load links when page loads
  loadLinks();
});
