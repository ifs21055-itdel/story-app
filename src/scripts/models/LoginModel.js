import ApiService from "../data/api-service.js";
import AuthService from "../data/auth-service.js";

class LoginModel {
  constructor() {
    this.user = null;
  }

  async authenticate(credentials) {
    try {
      const result = await ApiService.login(credentials);

      if (result.error) {
        throw new Error(result.message);
      }

      // Store authentication data
      this.user = result.loginResult;

      // Save token through AuthService
      AuthService.saveToken(result.loginResult.token);

      return result.loginResult;
    } catch (error) {
      console.error("Error in LoginModel.authenticate:", error);
      throw error;
    }
  }

  isAuthenticated() {
    return AuthService.isLoggedIn();
  }

  getCurrentUser() {
    return this.user;
  }

  clearAuthData() {
    this.user = null;
    AuthService.logout();
  }

  validateCredentials(email, password) {
    const errors = {};

    // Email validation
    if (!email) {
      errors.email = "Email is required";
    } else if (!this.isValidEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default LoginModel;
