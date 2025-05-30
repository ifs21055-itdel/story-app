class StoryDetailPresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
    this.map = null; // Store map instance
  }

  async init() {
    if (!this.model.isUserAuthenticated()) {
      this.view.renderAuthenticationRequired();
      this.view.redirectToLogin();
      return;
    }

    const storyId = this.model.getStoryIdFromUrl();
    if (!storyId) {
      this.view.showError("Story ID not found");
      this.view.redirectToHomeAfterDelay(2000);
      return;
    }

    await this.loadStoryDetail(storyId);
  }

  async loadStoryDetail(storyId) {
    try {
      this.view.showLoading();

      const result = await this.model.fetchStoryById(storyId);

      if (!result.success) {
        if (result.isAuthError) {
          this.model.logoutUser();
          this.view.renderAuthenticationRequired();
          this.view.redirectToLoginAfterDelay(2000);
          return;
        }
        throw new Error(result.error);
      }

      this.view.renderStoryDetail(result.data);

      if (this.model.hasLocation()) {
        const location = this.model.getLocation();

        this.view.initializeStoryMap(location.lat, location.lon, location.name);
      }
    } catch (error) {
      console.error("Error loading story detail:", error);
      this.view.showError(error.message || "Failed to load story details");
      this.view.redirectToHomeAfterDelay(3000);
    }
  }

  formatDate(dateString) {
    return this.model.formatDate(dateString);
  }

  truncateText(text, maxLength) {
    return this.model.truncateText(text, maxLength);
  }

  onBackToStories() {
    this.view.navigateToHome();
  }

  cleanup() {
    this.view.cleanupMap();
  }
}

export default StoryDetailPresenter;
