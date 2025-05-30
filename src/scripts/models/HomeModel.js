import ApiService from "../data/api-service.js";
import AuthService from "../data/auth-service.js";

class HomeModel {
  constructor() {
    this.stories = [];
  }

  async getStories() {
    try {
      if (!AuthService.isLoggedIn()) {
        throw new Error("Authentication required");
      }

      const response = await ApiService.getAllStories(1, 20, 1);

      if (response.error) {
        if (
          response.message &&
          (response.message.includes("token") ||
            response.message.includes("unauthorized") ||
            response.message.includes("session has expired"))
        ) {
          AuthService.logout();
          throw new Error("Session expired");
        }
        throw new Error(response.message);
      }

      this.stories = response.listStory || [];
      return this.stories;
    } catch (error) {
      console.error("Error in HomeModel.getStories:", error);
      throw error;
    }
  }

  isAuthenticated() {
    return AuthService.isLoggedIn();
  }

  logout() {
    AuthService.logout();
  }

  getStoriesWithValidCoordinates() {
    return this.stories.filter((story) => {
      if (!story.lat || !story.lon) return false;

      const lat = parseFloat(story.lat);
      const lon = parseFloat(story.lon);

      return (
        !isNaN(lat) &&
        !isNaN(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      );
    });
  }
}

export default HomeModel;
