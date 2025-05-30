import LoginPresenter from "../../presenters/LoginPresenter.js";
import LoginModel from "../../models/LoginModel.js";

const Login = {
  presenter: null,
  model: null,

  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">
          <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
          Login to Your Account
        </h2>
        
        <div id="login-message"></div>
        
        <form id="login-form" novalidate>
          <div class="form-group">
            <label for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required 
              autocomplete="email"
              aria-describedby="email-error"
              placeholder="Enter your email address"
            />
            <div id="email-error" class="error-message" style="display: none;" role="alert"></div>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              required 
              autocomplete="current-password"
              aria-describedby="password-error"
              placeholder="Enter your password"
            />
            <div id="password-error" class="error-message" style="display: none;" role="alert"></div>
          </div>
          
          <button type="submit" class="btn" id="login-button">
            <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
            Login
          </button>
        </form>
        
        <div style="text-align: center; margin-top: 1.5rem;">
          <p>Don't have an account? <a href="#/register" style="color: #667eea; text-decoration: none;">Register here</a></p>
        </div>
      </div>
    `;
  },

  async afterRender() {
    this.model = new LoginModel();
    this.presenter = new LoginPresenter(this, this.model);

    // Memeriksa apakah inisialisasi berhasil (pengguna belum login)
    if (!this.presenter.init()) {
      return; // Sudah terjadi redirect, hentikan eksekusi lebih lanjut
    }

    this.setupEventListeners();
  },

  setupEventListeners() {
    const form = document.querySelector("#login-form");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");

    // Real-time validation
    emailInput.addEventListener("blur", () => {
      const email = emailInput.value.trim();
      this.presenter.onEmailBlur(email);
    });

    passwordInput.addEventListener("blur", () => {
      const password = passwordInput.value;
      this.presenter.onPasswordBlur(password);
    });

    // Form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      await this.presenter.login(email, password);
    });
  },

  // View methods called by presenter
  showFieldError(fieldName, message) {
    const inputElement = document.querySelector(`#${fieldName}`);
    const errorElement = document.querySelector(`#${fieldName}-error`);

    if (inputElement) inputElement.style.borderColor = "#dc2626";
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  },

  hideFieldError(fieldName) {
    const inputElement = document.querySelector(`#${fieldName}`);
    const errorElement = document.querySelector(`#${fieldName}-error`);

    if (inputElement)
      inputElement.style.borderColor = "rgba(102, 126, 234, 0.2)";
    if (errorElement) errorElement.style.display = "none";
  },

  showValidationErrors(errors) {
    // Reset all errors first
    this.hideFieldError("email");
    this.hideFieldError("password");

    // Show specific errors
    Object.keys(errors).forEach((field) => {
      this.showFieldError(field, errors[field]);
    });
  },

  showMessage(message, type = "error") {
    const messageContainer = document.querySelector("#login-message");
    if (messageContainer) {
      // Periksa apakah container ada
      messageContainer.innerHTML = `
        <div class="message ${type}" role="alert">
            <i class="fas fa-${
              type === "error" ? "exclamation-triangle" : "check-circle"
            }" aria-hidden="true"></i>
            ${message}
        </div>
        `;
    }
  },

  showError(message) {
    this.showMessage(message, "error");
  },

  showSuccess(message) {
    this.showMessage(message, "success");
  },

  showLoading() {
    const loginButton = document.querySelector("#login-button");
    if (loginButton) {
      // Periksa apakah tombol ada
      loginButton.disabled = true;
      loginButton.innerHTML = `
        <div class="spinner" style="width: 16px; height: 16px; margin-right: 0.5rem;" aria-hidden="true"></div>
        Logging in...
        `;
    }
  },

  hideLoading() {
    const loginButton = document.querySelector("#login-button");
    if (loginButton) {
      // Periksa apakah tombol ada
      loginButton.disabled = false;
      loginButton.innerHTML = `
        <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
        Login
        `;
    }
  },

  redirectToHome() {
    window.location.hash = "#/home";
  },

  redirectToHomeAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/home";
    }, delay);
  },
};

export default Login;
