document.getElementById('loginForm').addEventListener('submit', function(event) {
    // Prevent the default form submission to handle validation
    event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    const usernameError = document.getElementById('username-error');
    const passwordError = document.getElementById('password-error');

    let isValid = true;

    // --- Username Validation ---
    if (usernameInput.value.trim() === '') {
        usernameError.textContent = 'Please enter your Student ID.';
        usernameError.style.visibility = 'visible';
        usernameInput.style.border = `2px solid ${passwordError.style.color}`; // Highlight input
        isValid = false;
    } else {
        usernameError.style.visibility = 'hidden';
        usernameInput.style.border = 'none';
    }

    // --- Password Validation ---
    if (passwordInput.value.trim() === '') {
        passwordError.textContent = 'Please enter your password.';
        passwordError.style.visibility = 'visible';
        passwordInput.style.border = `2px solid ${passwordError.style.color}`; // Highlight input
        isValid = false;
    } else if (passwordInput.value.length < 6) {
        passwordError.textContent = 'Password must be at least 6 characters.';
        passwordError.style.visibility = 'visible';
        passwordInput.style.border = `2px solid ${passwordError.style.color}`;
        isValid = false;
    } else {
        passwordError.style.visibility = 'hidden';
        passwordInput.style.border = 'none';
    }

    // --- Real Submission Logic ---
    if (isValid) {
        const usernameValue = usernameInput.value.trim();
        const passwordValue = passwordInput.value.trim();

        // 1. Tell Python we are trying to log in
        fetch('https://abunumaan.github.io/cbtplatform/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            // This 'credentials' line is the secret to fixing the 403 error!
            credentials: 'include', 
            body: JSON.stringify({
                username: usernameValue,
                password: passwordValue
            })
        })
        .then(response => {
            if (!response.ok) {
                // This happens if the username/password is wrong (401 error)
                return response.json().then(err => { throw new Error(err.message) });
            }
            return response.json();
        })
        .then(data => {
            // 2. If Python says OK, move to the exam
            alert('Login successful! Welcome, ' + usernameValue);
            window.location.href = 'exam.html';
        })
        .catch(error => {
            // 3. If Python says NO, show the error
            alert('Login Failed: ' + error.message);
            console.error('Error:', error);
        });
    }

});
