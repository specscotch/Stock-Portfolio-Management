document.addEventListener("DOMContentLoaded", function () {
  // Get references to DOM elements
  const formTitle = document.getElementById("form-title");
  const authForm = document.getElementById("auth-form");
  const usernameInput = document.getElementById("username");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("submit-btn");
  const toggleText = document.getElementById("toggle-text");
  const messageDiv = document.getElementById("message");
  const logoutBtn = document.createElement("button"); // Create a logout button

  // Track whether the form is in "Login" or "Sign Up" mode
  let isLoginMode = true;

  // Utility: Save to local storage
  function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Utility: Get from local storage
  function getFromLocalStorage(key) {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  // Utility: Remove from local storage
  function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
  }

  // Greet logged-in user (if any)
  const savedUser = getFromLocalStorage("user");
  if (savedUser && savedUser.username) {
    showMessage(`Welcome back, ${savedUser.username}!`, "success");
    showLogoutButton(); // Show logout button if user is logged in
  }

  // Toggle between Login and Sign Up
  function toggleMode() {
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
      formTitle.textContent = "Login";
      emailInput.style.display = "none";
      submitBtn.textContent = "Login";
      toggleText.innerHTML = `Don't have an account? <a href="#" class="toggle-link">Sign Up</a>`;
    } else {
      formTitle.textContent = "Sign Up";
      emailInput.style.display = "block";
      submitBtn.textContent = "Sign Up";
      toggleText.innerHTML = `Already have an account? <a href="#" class="toggle-link">Login</a>`;
    }

    attachToggleListener();
  }

  // Attach toggle listener
  function attachToggleListener() {
    const toggleLink = document.querySelector(".toggle-link");
    if (toggleLink) {
      toggleLink.addEventListener("click", (e) => {
        e.preventDefault();
        toggleMode();
      });
    }
  }

  attachToggleListener();

  // Handle form submission
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    // Clear previous messages
    messageDiv.textContent = "";
    messageDiv.className = "message";

    // Basic validation
    if ((isLoginMode && (username === "" || password === "")) ||
        (!isLoginMode && (username === "" || email === "" || password === ""))) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    try {
      const endpoint = isLoginMode ? "/login" : "/register";
      const payload = isLoginMode
        ? { username, password }
        : { username, email, password };

      const response = await fetch(`http://localhost:3000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");

        if (isLoginMode) {
          // Save user info in local storage on successful login
          saveToLocalStorage("user", { username });
          showLogoutButton(); // Show logout button after login
        } else {
          authForm.reset();
          toggleMode(); // Switch to login after successful signup
        }
      } else {
        showMessage(result.message || "Something went wrong", "error");
      }
    } catch (err) {
      showMessage("Network error. Please try again.", "error");
      console.error(err);
    }
  });

  // Function to show messages
  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = "block";
  }

  // Function to show logout button
  function showLogoutButton() {
    logoutBtn.textContent = "Logout";
    logoutBtn.className = "logout-button";
    logoutBtn.style.marginTop = "10px";
    authForm.parentNode.insertBefore(logoutBtn, authForm.nextSibling);

    logoutBtn.addEventListener("click", handleLogout);
  }

  // Function to handle logout
  function handleLogout() {
    removeFromLocalStorage("user");
    showMessage("You have been logged out.", "success");
    logoutBtn.remove(); // Remove the logout button
    authForm.reset();
    if (!isLoginMode) toggleMode(); // Switch to login mode if in sign-up mode
  }
});
