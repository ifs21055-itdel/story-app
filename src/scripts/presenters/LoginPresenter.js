class LoginPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  init() {
    if (this.model.isAuthenticated()) {
      this.view.redirectToHome();
      return false;
    }
    return true;
  }

  async login(email, password) {
    try {
      this.view.showLoading();

      const validation = this.model.validateCredentials(email, password);
      if (!validation.isValid) {
        this.view.showValidationErrors(validation.errors);
        return;
      }

      const user = await this.model.authenticate({ email, password });

      this.view.showSuccess("Login successful! Redirecting...");

      this.view.redirectToHomeAfterDelay(1500);
    } catch (error) {
      console.error("Login error:", error);
      this.view.showError(error.message || "Login failed. Please try again.");
    } finally {
      this.view.hideLoading();
    }
  }

  onEmailBlur(email) {
    if (!email) {
      this.view.showFieldError("email", "Email is required");
    } else if (!this.model.isValidEmail(email)) {
      this.view.showFieldError("email", "Please enter a valid email address");
    } else {
      this.view.hideFieldError("email");
    }
  }

  onPasswordBlur(password) {
    if (!password) {
      this.view.showFieldError("password", "Password is required");
    } else if (password.length < 8) {
      this.view.showFieldError(
        "password",
        "Password must be at least 8 characters long"
      );
    } else {
      this.view.hideFieldError("password");
    }
  }

  validateEmail(email) {
    return this.model.isValidEmail(email);
  }

  validateForm(email, password) {
    return this.model.validateCredentials(email, password);
  }
}

export default LoginPresenter;
