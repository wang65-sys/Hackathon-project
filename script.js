// Simple client-side login logic for Dengu Helpline
// Stores registered users in memory (session-only)

let registeredUsers = []; // array of { email, password }

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const messageDiv = document.getElementById('message');

function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Handle "Create Account" button
document.querySelector('.create-acc-btn').addEventListener('click', function() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage('Please enter both email and password.', 'error');
        return;
    }

    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    // Check if email already registered
    if (registeredUsers.some(user => user.email === email)) {
        showMessage('An account with this email already exists.', 'error');
        return;
    }

    registeredUsers.push({ email: email, password: password });
    showMessage('Account created successfully! You can now log in.', 'success');
    emailInput.value = '';
    passwordInput.value = '';
});

// Handle form submission (Log in)
form.addEventListener('submit', function(e) {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showMessage('Please enter both email and password.', 'error');
        return;
    }

    const user = registeredUsers.find(u => u.email === email && u.password === password);

    if (user) {
        showMessage('Login successful! Welcome back.', 'success');
        emailInput.value = '';
        passwordInput.value = '';
        // Redirect or next step could go here
        setTimeout(() => {
            alert('Redirecting to dashboard...');
        }, 1000);
    } else {
        showMessage('Invalid email or password. Please try again.', 'error');
    }
});
