import ApiService from "../data/api-service.js";
import AuthService from "../data/auth-service.js";

class AddStoryModel {
  constructor() {
    this.capturedPhoto = null;
    this.selectedLocation = null;
    this.description = "";
  }

  // Authentication methods
  isUserLoggedIn() {
    return AuthService.isLoggedIn();
  }

  logoutUser() {
    AuthService.logout();
  }

  // Story data management
  setCapturedPhoto(photo) {
    this.capturedPhoto = photo;
  }

  getCapturedPhoto() {
    return this.capturedPhoto;
  }

  setSelectedLocation(location) {
    this.selectedLocation = location;
  }

  getSelectedLocation() {
    return this.selectedLocation;
  }

  setDescription(description) {
    this.description = description.trim();
  }

  getDescription() {
    return this.description;
  }

  // Validation
  validateStoryData() {
    const errors = {};

    if (!this.description) {
      errors.description = "Story description is required";
    } else if (this.description.length < 10) {
      errors.description = "Description must be at least 10 characters long";
    }

    if (!this.capturedPhoto) {
      errors.photo = "Please capture or upload a photo";
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // API calls
  async submitStoryToServer() {
    const storyData = {
      description: this.description,
      photo: this.capturedPhoto,
      ...(this.selectedLocation && {
        lat: this.selectedLocation.lat,
        lon: this.selectedLocation.lon,
      }),
    };

    return await ApiService.addStory(storyData);
  }

  // Reset model data
  reset() {
    this.capturedPhoto = null;
    this.selectedLocation = null;
    this.description = "";
  }

  // Helper methods for validation
  validateDescription(description) {
    if (!description) {
      return "Story description is required";
    } else if (description.length < 10) {
      return "Description must be at least 10 characters long";
    }
    return null;
  }

  hasValidStoryData() {
    return this.description && this.capturedPhoto;
  }
}

export default AddStoryModel;
