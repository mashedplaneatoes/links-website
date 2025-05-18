document.addEventListener('DOMContentLoaded', () => {
  const suggestionForm = document.getElementById('suggestion-form');
  const successMessage = document.getElementById('suggestion-success');
  const errorMessage = document.getElementById('suggestion-error');
  
  // Apply fixed background image on page load
  applyBackgroundImage();
  
  // Handle suggestion form submission
  suggestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Hide messages
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');
    
    // Get form values
    const name = document.getElementById('name').value.trim();
    const url = document.getElementById('url').value.trim();
    const description = document.getElementById('description').value.trim();
    const imageUrl = document.getElementById('image-url').value.trim();
    
    // Validate form
    if (!name || !url) {
      showError('Name and URL are required');
      return;
    }
    
    try {
      // Add suggestion to Firestore
      await db.collection('suggestions').add({
        name,
        url,
        description: description || null,
        imageUrl: imageUrl || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      // Show success message and reset form
      showSuccess();
      suggestionForm.reset();
    } catch (error) {
      console.error("Error submitting suggestion:", error);
      showError('Error submitting suggestion. Please try again.');
    }
  });
  
  // Function to show error message
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
  }
  
  // Function to show success message
  function showSuccess() {
    successMessage.classList.remove('hidden');
  }
  
  // Function to apply fixed background image
  function applyBackgroundImage() {
    // Set your fixed background image URL here
    const fixedBackgroundUrl = 'https://your-background-image-url.jpg';
    
    document.body.style.backgroundImage = `url(${fixedBackgroundUrl})`;
    document.body.classList.add('with-bg-image');
  }
});
