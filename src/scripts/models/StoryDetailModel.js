// models/StoryDetailModel.js
import ApiService from "../data/api-service.js";
import AuthService from "../data/auth-service.js";
import UrlParser from "../routes/url-parser.js";

class StoryDetailModel {
  constructor() {
    this.apiService = ApiService;
    this.authService = AuthService;
    this.urlParser = UrlParser;
    this.story = null;
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.authService.isLoggedIn();
  }

  // Get story ID from URL
  getStoryIdFromUrl() {
    const url = this.urlParser.parseActiveUrlWithoutCombiner();
    return url.id;
  }

  // Fetch story details by ID
  async fetchStoryById(storyId) {
    try {
      if (!this.isUserAuthenticated()) {
        throw new Error("Authentication required");
      }

      const response = await this.apiService.getStoryById(storyId);

      if (response.error) {
        if (
          response.message &&
          (response.message.includes("token") ||
            response.message.includes("unauthorized"))
        ) {
          this.authService.logout();
          throw new Error("Authentication expired");
        }
        throw new Error(response.message);
      }

      this.story = response.story;
      return {
        success: true,
        data: this.story,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || "Failed to fetch story details",
        isAuthError:
          error.message === "Authentication required" ||
          error.message === "Authentication expired" ||
          error.message.includes("token") ||
          error.message.includes("unauthorized"),
      };
    }
  }

  // Format date utility
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Truncate text utility
  truncateText(text, maxLength) {
    if (!text) return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  }

  // Check if story has location data
  hasLocation() {
    return this.story && this.story.lat && this.story.lon;
  }

  // Get story location
  getLocation() {
    if (!this.hasLocation()) return null;

    return {
      lat: parseFloat(this.story.lat),
      lon: parseFloat(this.story.lon),
      name: this.story.name || "Anonymous",
    };
  }

  // Logout user (when auth fails)
  logoutUser() {
    this.authService.logout();
  }

  // Get current story
  getCurrentStory() {
    return this.story;
  }
}

export default StoryDetailModel;
