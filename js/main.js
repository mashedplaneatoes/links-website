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
      
      // Organize links by folder
      const folders = {};
      const rootLinks = [];
      
      snapshot.forEach(doc => {
        const link = doc.data();
        link.id = doc.id;
        
        if (link.folder) {
          // Add to folder
          if (!folders[link.folder]) {
            folders[link.folder] = {
              name: link.folder,
              links: [],
              subfolders: {}
            };
          }
          
          // Check if it belongs in a subfolder
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
          // Add to root
          rootLinks.push(link);
        }
      });
      
      // Display folders first
      for (const folderName in folders) {
        const folder = folders[folderName];
        const folderElement = document.createElement('div');
        folderElement.className = 'folder';
        
        // Create folder header
        const folderHeader = document.createElement('div');
        folderHeader.className = 'folder-header';
        folderHeader.innerHTML = `
          <h3>${folder.name}</h3>
          <span class="folder-toggle">▼</span>
        `;
        folderElement.appendChild(folderHeader);
        
        // Create folder content
        const folderContent = document.createElement('div');
        folderContent.className = 'folder-content';
        
        // Add links in this folder
        folder.links.forEach(link => {
          folderContent.appendChild(createLinkCard(link));
        });
        
        // Add subfolders
        for (const subfolderName in folder.subfolders) {
          const subfolder = folder.subfolders[subfolderName];
          const subfolderElement = document.createElement('div');
          subfolderElement.className = 'subfolder';
          
          // Create subfolder header
          const subfolderHeader = document.createElement('div');
          subfolderHeader.className = 'folder-header';
          subfolderHeader.innerHTML = `
            <h3>${subfolder.name}</h3>
            <span class="folder-toggle">▼</span>
          `;
          subfolderElement.appendChild(subfolderHeader);
          
          // Create subfolder content
          const subfolderContent = document.createElement('div');
          subfolderContent.className = 'folder-content';
          
          // Add links in this subfolder
          subfolder.links.forEach(link => {
            subfolderContent.appendChild(createLinkCard(link));
          });
          
          subfolderElement.appendChild(subfolderContent);
          folderContent.appendChild(subfolderElement);
          
          // Add toggle functionality to subfolder
          subfolderHeader.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering parent folder toggle
            subfolderContent.style.display = subfolderContent.style.display === 'none' ? 'block' : 'none';
            subfolderHeader.querySelector('.folder-toggle').textContent = 
              subfolderContent.style.display === 'none' ? '▶' : '▼';
          });
        }
        
        folderElement.appendChild(folderContent);
        linksContainer.appendChild(folderElement);
        
        // Add toggle functionality to folder
        folderHeader.addEventListener('click', () => {
          folderContent.style.display = folderContent.style.display === 'none' ? 'block' : 'none';
          folderHeader.querySelector('.folder-toggle').textContent = 
            folderContent.style.display === 'none' ? '▶' : '▼';
        });
      }
      
      // Display root links
      if (rootLinks.length > 0) {
        const rootElement = document.createElement('div');
        rootElement.className = 'links-container';
        
        rootLinks.forEach(link => {
          rootElement.appendChild(createLinkCard(link));
        });
        
        linksContainer.appendChild(rootElement);
      }
    } catch (error) {
      console.error("Error loading links:", error);
      linksContainer.innerHTML = '<p class="error-message">Error loading links. Please try again later.</p>';
    }
  }
  
  // Function to create a link card
  function createLinkCard(link) {
    const linkElement = document.createElement('div');
    linkElement.className = 'link-card';
    
    if (link.password) {
      // Password protected link
      linkElement.innerHTML = `
        <h3>${link.name}</h3>
        <p class="password-protected">🔒 This link is password protected</p>
        <div class="password-form">
          <input type="password" placeholder="Enter password" id="password-${link.id}" class="password-input">
          <button onclick="unlockLink('${link.id}')">Unlock</button>
        </div>
      `;
    } else {
      // Regular link
      linkElement.innerHTML = `
        <h3>${link.name}</h3>
        <a href="${link.url}" target="_blank">Visit Link</a>
      `;
    }
    
    return linkElement;
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
