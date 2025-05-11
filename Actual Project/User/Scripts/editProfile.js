
OPENCAGE_API_KEY= '2caa6cd327404e8a8881300f50f2d21c';
function openEditForm() {
    document.getElementById('editProfileModal').style.display = 'flex';
}

function closeEditForm() {
    document.getElementById('editProfileModal').style.display = 'none';
}

window.onload = () => {
    document.getElementById('editFullName').value = "John Doe"

    document.getElementById('editEmail').value = "john.doe@example.com";
    document.getElementById('editPhone').value = "+1 (555) 123-4567";
    document.getElementById('editLocation').value = "123 Main Street, Cityville";
};


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