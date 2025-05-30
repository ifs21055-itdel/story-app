class RegisterPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async init() {
    const isLoggedIn = await this.model.isUserLoggedIn();
    if (isLoggedIn) {
      this.view.redirectToHome();
      return false;
    }
    return true;
  }

  async register(name, email, password) {
    try {
      this.view.showLoading();

      // Validate form
      const validation = this.model.validateForm(name, email, password);
      if (!validation.isValid) {
        this.view.showValidationErrors(validation.errors);
        return;
      }

      // Register user
      const result = await this.model.registerUser({ name, email, password });

      if (!result.success) {
        throw new Error(result.error);
      }

      this.view.showSuccess(
        "Account created successfully! Redirecting to login..."
      );

      this.view.redirectToLoginAfterDelay(2000);
    } catch (error) {
      console.error("Registration error:", error);
      this.view.showError(
        error.message || "Registration failed. Please try again."
      );
    } finally {
      this.view.hideLoading();
    }
  }

  onNameBlur(name) {
    const validation = this.model.validateField("name", name);
    if (!validation.isValid) {
      this.view.showFieldError("name", validation.error);
    } else {
      this.view.hideFieldError("name");
    }
  }

  onEmailBlur(email) {
    const validation = this.model.validateField("email", email);
    if (!validation.isValid) {
      this.view.showFieldError("email", validation.error);
    } else {
      this.view.hideFieldError("email");
    }
  }

  onPasswordBlur(password) {
    const validation = this.model.validateField("password", password);
    if (!validation.isValid) {
      this.view.showFieldError("password", validation.error);
    } else {
      this.view.hideFieldError("password");
    }
  }
}

export default RegisterPresenter;
