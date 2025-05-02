// Unified script for form validation and OTP handling
document.addEventListener("DOMContentLoaded", function () {
    // all your JS code here

// EmailJS public key
emailjs.init('_PQlkm6Bfx4WIq1Px');

let generatedOTP = "";

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

function validateName() {
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

function validateEmail() {
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

function checkPassword() {
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

    // If form is valid, generate and send OTP
    const email = emailInput.value;
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    const templateParams = {
        to_email: email,
        otp: generatedOTP,
    };

    emailjs.send('service_auy2e9x', 'template_46aynot', templateParams)
        .then(response => {
            otpInputDiv.style.display = 'block';
            document.getElementById("verify-otp-btn").style.display = "block"; // <-- ADD THIS
            otpError.innerHTML = "✅ OTP sent to your email";
        })
        .catch(error => {
            otpError.innerHTML = "❌ Failed to send OTP";
        });
});

document.getElementById("verify-otp-btn").addEventListener("click", function () {
    const enteredOTP = otpInputField.value;

    if (enteredOTP === generatedOTP) {
        otpError.innerHTML = "✅ OTP verified. You can now register.";
        // Optionally: Submit the form or enable registration
    } else {
        otpError.innerHTML = "❌ Incorrect OTP. Try again.";
    }
});

});
