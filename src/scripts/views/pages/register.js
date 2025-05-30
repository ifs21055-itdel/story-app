import RegisterPresenter from "../../presenters/RegisterPresenter.js";
import RegisterModel from "../../models/RegisterModel.js";

const Register = {
  presenter: null,
  model: null,

  async render() {
    return `
      <div class="form-container">
        <h2 class="form-title">
          <i class="fas fa-user-plus" aria-hidden="true"></i>
          Create Your Account
        </h2>

        <div id="register-message"></div>

        <form id="register-form" novalidate>
          <div class="form-group">
            <label for="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              required
              autocomplete="name"
              aria-describedby="name-error"
              placeholder="Enter your full name"
            />
            <div id="name-error" class="error-message" style="display: none;" role="alert"></div>
          </div>

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
              autocomplete="new-password"
              aria-describedby="password-error"
              placeholder="Enter your password"
            />
            <div id="password-error" class="error-message" style="display: none;" role="alert"></div>
          </div>

          <button type="submit" class="btn" id="register-button">
            <i class="fas fa-user-plus" aria-hidden="true"></i>
            Create Account
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem;">
          <p>Already have an account? <a href="#/login" style="color: #667eea; text-decoration: none;">Login here</a></p>
        </div>
      </div>
    `;
  },

  async afterRender() {
    this.model = new RegisterModel();
    this.presenter = new RegisterPresenter(this, this.model);

    // Memanggil init dari presenter dan menangani redirect di view
    const shouldProceed = await this.presenter.init();
    if (!shouldProceed) {
      return; // Jika presenter mengindikasikan redirect, hentikan eksekusi afterRender
    }

    this._setupEventListeners();
  },

  _setupEventListeners() {
    const form = document.querySelector("#register-form");
    const nameInput = document.querySelector("#name");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");

    nameInput.addEventListener("blur", () => {
      const name = nameInput.value.trim();
      this.presenter.onNameBlur(name);
    });

    emailInput.addEventListener("blur", () => {
      const email = emailInput.value.trim();
      this.presenter.onEmailBlur(email);
    });

    passwordInput.addEventListener("blur", () => {
      const password = passwordInput.value;
      this.presenter.onPasswordBlur(password);
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      await this.presenter.register(name, email, password);
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
    this.hideFieldError("name");
    this.hideFieldError("email");
    this.hideFieldError("password");

    Object.keys(errors).forEach((field) => {
      this.showFieldError(field, errors[field]);
    });
  },

  showMessage(message, type = "error") {
    const container = document.querySelector("#register-message");
    container.innerHTML = `
      <div class="message ${type}" role="alert">
        <i class="fas fa-${
          type === "error" ? "exclamation-triangle" : "check-circle"
        }" aria-hidden="true"></i>
        ${message}
      </div>
    `;
  },

  showError(message) {
    this.showMessage(message, "error");
  },

  showSuccess(message) {
    this.showMessage(message, "success");
  },

  showLoading() {
    const button = document.querySelector("#register-button");
    button.disabled = true;
    button.innerHTML = `
      <div class="spinner" style="width: 16px; height: 16px; margin-right: 0.5rem;" aria-hidden="true"></div>
      Creating Account...
    `;
  },

  hideLoading() {
    const button = document.querySelector("#register-button");
    button.disabled = false;
    button.innerHTML = `
      <i class="fas fa-user-plus" aria-hidden="true"></i>
      Create Account
    `;
  },

  // New view methods for redirection
  redirectToHome() {
    window.location.hash = "#/home";
  },

  redirectToLoginAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/login";
    }, delay);
  },
};

export default Register;
