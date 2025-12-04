// Unified script for form validation and OTP handling

let generatedOTP = "";

// Make validation functions global so they can be called from HTML onkeyup
window.validateName = function() {
    var nameError = document.getElementById("name-error-signup");
    var name = document.getElementById("signup-username").value;
    if (name.length === 0) {
        nameError.innerHTML = "Username is required!";
        return false;
    }
    if (name.length <= 5) {
        nameError.innerHTML = "Username must contain at least 5 characters!";
        return false;
    }
    if (!name.match(/^[^\s]+$/)) {
        nameError.innerHTML = "Username can't contain spaces!";
        return false;
    }
    nameError.innerHTML = '<i class="fas fa-check-circle"></i>';
    return true;
}

window.validateEmail = function() {
    var emailError = document.getElementById("email-error");
    var emailInput = document.getElementById("contact-email");
    var email = emailInput.value;
    if (email.length === 0) {
        emailError.innerHTML = "Email is required";
        return false;
    }
    if (!email.match(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)) {
        emailError.innerHTML = "Invalid email!";
        return false;
    }
    emailError.innerHTML = '<i class="fas fa-check-circle"></i>';
    return true;
}

window.checkPassword = function() {
    var passwordError = document.getElementById("password-error");
    var confirmPasswordError = document.getElementById("confirm-password-error");
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

    if (password.length === 0) {
        passwordError.innerHTML = "Password is required!";
        return false;
    }
    if (!passwordRegex.test(password)) {
        passwordError.innerHTML = "Must contain letter, number, special character";
        return false;
    }
    if (confirmPassword.length === 0) {
        confirmPasswordError.innerHTML = "Please confirm your password!";
        return false;
    }
    if (password !== confirmPassword) {
        confirmPasswordError.innerHTML = "Passwords do not match!";
        return false;
    }
    passwordError.innerHTML = '<i class="fas fa-check-circle"></i>';
    confirmPasswordError.innerHTML = '<i class="fas fa-check-circle"></i>';
    return true;
}

document.addEventListener("DOMContentLoaded", function () {

const form = document.querySelector(".sign-up-form");
const emailInput = document.getElementById("contact-email");
const otpInputDiv = document.getElementById("otp-container");
const otpInputField = document.getElementById("otp-input");
const otpError = document.getElementById("otp-error");
const submitError = document.getElementById("submit-error");



// ------- Validation Logic --------

var nameError = document.getElementById("name-error-signup");
var emailError = document.getElementById("email-error");
var passwordError = document.getElementById("password-error");
var confirmPasswordError = document.getElementById("confirm-password-error");

function validateForm() {
    if (!validateName() || !validateEmail() || !checkPassword()) {
        submitError.style.display = "block";
        submitError.innerHTML = "Please fix errors to submit!";
        setTimeout(() => {
            submitError.style.display = "none";
        }, 3000);
        return false;
    }
    return true;
}

function togglePassword(fieldId, icon) {
    const field = document.getElementById(fieldId);
    if (field.type === "password") {
        field.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        field.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}
document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", function () {
            const fieldId = this.getAttribute("data-target");
            togglePassword(fieldId, this);
        });
    });


//OTP LOGIC

form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    // If form is valid, send OTP via server
    const email = emailInput.value;

    // Show loading state
    otpError.innerHTML = "📨 Sending OTP...";
    otpError.style.color = "#1976d2";

    // Send OTP request to server
    fetch('/send-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            otpInputDiv.style.display = 'block';
            document.getElementById("verify-otp-btn").style.display = "block";
            otpError.innerHTML = "✅ OTP sent to your email";
            otpError.style.color = "#28a745";
        } else {
            otpError.innerHTML = "❌ " + data.message;
            otpError.style.color = "#dc3545";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        otpError.innerHTML = "❌ Failed to send OTP. Please try again.";
        otpError.style.color = "#dc3545";
    });
});

document.getElementById("verify-otp-btn").addEventListener("click", function () {
    const enteredOTP = otpInputField.value;
    const email = document.getElementById("contact-email").value;

    if (!enteredOTP || enteredOTP.length !== 6) {
        otpError.innerHTML = "❌ Please enter a valid 6-digit OTP";
        otpError.style.color = "#dc3545";
        return;
    }

    // Show verifying state
    otpError.innerHTML = "🔄 Verifying OTP...";
    otpError.style.color = "#1976d2";

    // Verify OTP with server
    fetch('/verify-otp', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            email: email, 
            otp: enteredOTP 
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            otpError.innerHTML = "✅ OTP verified. Creating your account...";
            otpError.style.color = "#28a745";

            // Get Form Data
            const username = document.getElementById("signup-username").value;
            const password = document.getElementById("signup-password").value;

            // Create AJAX request for signup
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/signup", true);
            xhr.setRequestHeader("Content-Type", "application/json");
            
            const signupData = JSON.stringify({
                username: username,
                email: email,
                password: password
            });
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            otpError.innerHTML = "✅ " + response.message;
                            
                            // Redirect to profile page after successful registration
                            setTimeout(() => {
                                window.location.href = "/profile";
                            }, 2000);
                        } catch (e) {
                            otpError.innerHTML = "✅ Registration successful!";
                            setTimeout(() => {
                                window.location.href = "/profile";
                            }, 2000);
                        }
                    } else {
                        otpError.innerHTML = "❌ Registration failed: " + xhr.responseText;
                        otpError.style.color = "#dc3545";
                    }
                }
            };

            xhr.send(signupData);
        } else {
            otpError.innerHTML = "❌ " + data.message;
            otpError.style.color = "#dc3545";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        otpError.innerHTML = "❌ Failed to verify OTP. Please try again.";
        otpError.style.color = "#dc3545";
    });
});

});