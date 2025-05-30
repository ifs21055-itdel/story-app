class HomePresenter {
  constructor(view, model) {
    this.view = view;
    this.model = model;
  }

  async init() {
    const isAuthenticated = await this.model.isAuthenticated();

    if (!isAuthenticated) {
      this.view.renderAuthenticationRequired();
      return;
    }

    this.view.initializeMap();
    await this.loadStories();
  }

  async loadStories() {
    try {
      this.view.showLoading();

      const stories = await this.model.getStories();

      this.view.renderStories(stories);
      this.view.addStoriesToMap(stories);
    } catch (error) {
      console.error("Error loading stories:", error);

      if (
        error.message === "Authentication required" ||
        error.message === "Session expired" ||
        error.message.includes("token") ||
        error.message.includes("unauthorized") ||
        error.message.includes("session has expired")
      ) {
        this.model.logout();
        this.view.showError("Your session has expired. Please login again.");

        return;
      }

      this.view.showError(`Failed to load stories. ${error.message}`);
    }
  }

  onStoryClick(storyId) {
    this.view.navigateToStoryDetail(storyId);
  }

  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  formatDate(isoDate) {
    const date = new Date(isoDate);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
}

export default HomePresenter;
