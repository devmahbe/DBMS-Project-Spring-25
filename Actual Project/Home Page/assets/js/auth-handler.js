document.addEventListener('DOMContentLoaded', function() {
    console.log("Auth handler loaded");
    console.log("Is authenticated:", window.isAuthenticated);
    console.log("Current user:", window.currentUser);
    
    // Check if authentication variables are defined
    if (typeof window.isAuthenticated === 'undefined' || typeof window.currentUser === 'undefined') {
        console.log("Authentication variables not found");
        return;
    }
    
    // Check if user is authenticated
    if (window.isAuthenticated && window.currentUser) {
        console.log("User is authenticated, updating UI");
        
        // Get the header icons container
        const headerIcons = document.querySelector('.header-icons');
        if (!headerIcons) {
            console.error("Header icons container not found");
            return;
        }
        
        // Hide the regular user/admin icons
        const userAdminIcons = headerIcons.querySelectorAll('.icon-items');
        userAdminIcons.forEach(icon => {
            icon.style.display = 'none';
        });
        
        // Create user welcome element
        const userAuthContainer = document.createElement('div');
        userAuthContainer.className = 'user-auth-container';
        
        // Add user welcome display with link to profile
        userAuthContainer.innerHTML = `
            <div class="user-welcome" onclick="goToProfile()" style="cursor: pointer;">
                <div class="user-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>
                <span class="username">${window.currentUser}</span>
            </div>
            <button class="logout-button" onclick="logoutUser()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </button>
        `;
        
        // Add to header
        headerIcons.appendChild(userAuthContainer);
        
        // Also hide from mobile menu
        const mobileNavItems = document.querySelectorAll('.nav-user-admin');
        mobileNavItems.forEach(item => {
            item.style.display = 'none';
        });
    } else {
        console.log("User is not authenticated");
    }
});

// Function to navigate to profile page
function goToProfile() {
    window.location.href = '/profile';
}

// Logout function
function logoutUser() {
    console.log("Logout function called");
    fetch('/logout', {
        method: 'POST',
        credentials: 'same-origin'
    })
    .then(response => {
        console.log("Logout response:", response);
        if (response.ok) {
            window.location.href = '/signup';
        }
    })
    .catch(error => {
        console.error('Logout error:', error);
        alert('Error logging out. Please try again.');
    });
}