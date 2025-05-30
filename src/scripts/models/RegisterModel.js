// models/RegisterModel.js
import ApiService from "../data/api-service.js";
import AuthService from "../data/auth-service.js";

class RegisterModel {
  constructor() {
    this.apiService = ApiService;
    this.authService = AuthService;
  }

  // Check if user is already logged in
  isUserLoggedIn() {
    return this.authService.isLoggedIn();
  }

  // Validate email format
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate form data
  validateForm(name, email, password) {
    const errors = {};

    if (!name) {
      errors.name = "Full name is required";
    } else if (name.length < 2) {
      errors.name = "Name must be at least 2 characters long";
    }

    if (!email) {
      errors.email = "Email is required";
    } else if (!this.validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }

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

  // Validate individual field
  validateField(fieldName, value) {
    switch (fieldName) {
      case "name":
        if (!value) {
          return { isValid: false, error: "Full name is required" };
        } else if (value.length < 2) {
          return {
            isValid: false,
            error: "Name must be at least 2 characters long",
          };
        }
        break;
      case "email":
        if (!value) {
          return { isValid: false, error: "Email is required" };
        } else if (!this.validateEmail(value)) {
          return {
            isValid: false,
            error: "Please enter a valid email address",
          };
        }
        break;
      case "password":
        if (!value) {
          return { isValid: false, error: "Password is required" };
        } else if (value.length < 8) {
          return {
            isValid: false,
            error: "Password must be at least 8 characters long",
          };
        }
        break;
      default:
        return { isValid: true };
    }
    return { isValid: true };
  }

  // Register user through API
  async registerUser(userData) {
    try {
      const result = await this.apiService.register(userData);

      if (result.error) {
        throw new Error(result.message);
      }

      return {
        success: true,
        data: result,
        message: "Account created successfully!",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      };
    }
  }
}

export default RegisterModel;
