document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const successModal = document.getElementById("successModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const mapBtn = document.querySelector(".map-btn");
    const locationInput = document.getElementById("location");
    const mapContainer = document.querySelector(".map-placeholder");

    let map;
    let marker;

    mapBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(success, error);

        function success(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Get formatted address from OpenCage
            const apiUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPENCAGE_API_KEY}`;

            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    if (data.results.length > 0) {
                        const formatted = data.results[0].formatted;
                        locationInput.value = formatted;
                        mapContainer.innerHTML = `<div id="map" style="height: 300px;"></div>`;

                        // Initialize Leaflet map
                        if (!map) {
                            map = L.map('map').setView([lat, lng], 16);
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '&copy; OpenStreetMap contributors'
                            }).addTo(map);
                        } else {
                            map.setView([lat, lng], 16);
                        }

                        if (marker) {
                            marker.setLatLng([lat, lng]);
                        } else {
                            marker = L.marker([lat, lng]).addTo(map);
                        }

                        marker.bindPopup(`📍 ${formatted}`).openPopup();
                    } else {
                        alert("No address found.");
                    }
                })
                .catch(() => alert("Failed to fetch location data."));
        }

        function error() {
            alert("Unable to retrieve your location.");
        }
    });

    // Submit Modal
    form.addEventListener("submit", function (e) {
        e.preventDefault();
        successModal.classList.remove("hidden");
        form.reset();
    });

    closeModalBtn.addEventListener("click", () => {
        successModal.classList.add("hidden");
    });
});
