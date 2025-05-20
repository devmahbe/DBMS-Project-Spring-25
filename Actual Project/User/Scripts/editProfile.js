// This should be added to Scripts/editProfile.js

document.addEventListener("DOMContentLoaded", function() {
    const editProfileForm = document.getElementById("editProfileForm");
    
    if (editProfileForm) {
        editProfileForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            // Get form values
            const fullName = document.getElementById("editFullName").value;
            const email = document.getElementById("editEmail").value;
            const phone = document.getElementById("editPhone").value;
            const location = document.getElementById("editLocation").value;
            const dob = document.getElementById("editDOB").value;
            
            console.log("Form data being submitted:", {
                fullName, email, phone, location, dob
            });
            
            // Create AJAX request
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/update-profile", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            
            // Prepare data
            const data = JSON.stringify({
                fullName: fullName,
                email: email,
                phone: phone,
                location: location,
                dob: dob
            });
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    console.log("Response status:", xhr.status);
                    console.log("Response text:", xhr.responseText);
                    
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                // Close modal and refresh page to show updated info
                                closeEditForm();
                                window.location.reload();
                            } else {
                                alert("Error: " + response.message);
                            }
                        } catch (e) {
                            console.error("Error parsing response:", e);
                            alert("An error occurred while processing the response");
                        }
                    } else {
                        alert("Error updating profile: " + xhr.responseText);
                    }
                }
            };
            
            xhr.send(data);
        });
    }
});

function openEditForm() {
    // Fetch user data when the edit form is opened
    fetchUserData();
    document.getElementById("editProfileModal").style.display = "flex";
}

function closeEditForm() {
    console.log("Closing edit form from editProfile.js");
    const modal = document.getElementById("editProfileModal");
    if (modal) {
        modal.style.display = "none";
    } else {
        console.error("Modal element not found");
    }
}

// Also, add this at the bottom of your DOMContentLoaded event
document.addEventListener("DOMContentLoaded", function() {
    // Add event listener for cancel button
    const cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) {
        console.log("Cancel button found in editProfile.js");
        cancelBtn.addEventListener("click", function() {
            console.log("Cancel button clicked from editProfile.js");
            const modal = document.getElementById("editProfileModal");
            if (modal) {
                modal.style.display = "none";
            }
        });
    }
});

// Make sure window.closeEditForm is properly set
window.closeEditForm = closeEditForm;

function fetchUserData() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/get-user-data", true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    console.log("User data response:", response);
                    
                    if (response.success) {
                        const user = response.user;
                        
                        // Populate form fields with user data - using correct case for fullName
                        document.getElementById('editFullName').value = user.fullName || "";
                        document.getElementById('editEmail').value = user.email || "";
                        document.getElementById('editPhone').value = user.phone || "";
                        document.getElementById('editLocation').value = user.location || "";
                        
                        // Format date if exists
                        if (user.dob) {
                            const dobDate = new Date(user.dob);
                            const formattedDob = dobDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                            document.getElementById('editDOB').value = formattedDob;
                        }
                    } else {
                        alert("Error: " + response.message);
                    }
                } catch (e) {
                    console.error("Error parsing response:", e);
                    alert("An error occurred while processing the response");
                }
            } else {
                alert("Error fetching user data");
            }
        }
    };
    
    xhr.send();
}

const OPENCAGE_API_KEY = '2caa6cd327404e8a8881300f50f2d21c';

function getLocation() {
    const locationInput = document.getElementById("editLocation");

    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(success, error);

    function success(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`;

        fetch(apiUrl)
            .then((response) => response.json())
            .then((data) => {
                if (data.results.length > 0) {
                    const formatted = data.results[0].formatted;
                    locationInput.value = formatted;
                } else {
                    alert("No address found for your location.");
                }
            })
            .catch(() => {
                alert("Failed to fetch location data.");
            });
    }

    function error() {
        alert("Unable to retrieve your location.");
    }
}

window.getLocation = getLocation;
window.openEditForm = openEditForm;
window.closeEditForm = closeEditForm;