document.addEventListener('DOMContentLoaded', () => {
    emailjs.init('_PQlkm6Bfx4WIq1Px'); // your public key

    const form = document.getElementById('otp-form');
    const emailInput = document.getElementById('email');
    const status = document.getElementById('status');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const email = emailInput.value;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const templateParams = {
            to_email: email,
            otp: otp,
        };

        emailjs.send('service_auy2e9x', 'template_46aynot', templateParams)
            .then(response => {
                status.textContent = `✅ OTP sent to ${email}`;
                status.className = 'success';
            })
            .catch(error => {
                status.textContent = `❌ Failed to send OTP: ${error.text || error.message}`;
                status.className = 'error';
            });
    });
});
