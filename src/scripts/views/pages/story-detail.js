import StoryDetailPresenter from "../../presenters/StoryDetailPresenter.js";
import StoryDetailModel from "../../models/StoryDetailModel.js";

const StoryDetail = {
  presenter: null,
  model: null,
  map: null,

  async render() {
    return `
      <div id="story-detail-content">
        <div class="loading">
          <div class="spinner" aria-hidden="true"></div>
          <span>Loading story details...</span>
        </div>
      </div>
    `;
  },

  async afterRender() {
    this.model = new StoryDetailModel();
    this.presenter = new StoryDetailPresenter(this, this.model);
    await this.presenter.init();
  },

  destroy() {
    if (this.presenter) {
      this.presenter.cleanup();
    }
  },

  renderAuthenticationRequired() {
    const container = document.querySelector("#story-detail-content");
    if (!container) return;

    container.innerHTML = `
      <div class="form-container">
        <h2 class="form-title">Authentication Required</h2>
        <div class="message error">
          <i class="fas fa-lock" aria-hidden="true"></i>
          You need to login to view story details.
        </div>
        <div style="text-align: center; margin-top: 2rem;">
          <a href="#/login" class="btn">
            <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
            Login
          </a>
          <a href="#/home" class="btn btn-secondary" style="margin-left: 1rem;">
            <i class="fas fa-home" aria-hidden="true"></i>
            Go Home
          </a>
        </div>
      </div>
    `;
  },

  renderStoryDetail(story) {
    const container = document.querySelector("#story-detail-content");
    if (!container) return;

    container.innerHTML = `
      <div class="story-detail-container">
        <div class="story-detail-header">
          <h1 class="story-detail-title">Story by ${
            story.name || "Anonymous"
          }</h1>
          <div class="story-date" style="text-align: center; color: #666; margin-bottom: 2rem;">
            <i class="fas fa-calendar-alt" aria-hidden="true"></i>
            <time datetime="${story.createdAt}">
              ${this.presenter.formatDate(story.createdAt)}
            </time>
          </div>
        </div>

        <div class="story-detail-content">
          <img 
            src="${story.photoUrl}" 
            alt="Story image by ${story.name || "Anonymous"}"
            class="story-detail-image"
          />

          <div class="story-detail-description">
            <p class="truncate-multiline">${story.description}</p>
          </div>

          ${
            story.lat && story.lon
              ? `
            <div class="map-container">
              <div class="map-header">
                <h3 class="map-title">
                  <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                  Story Location
                </h3>
                <p class="map-subtitle">
                  Coordinates: ${parseFloat(story.lat).toFixed(
                    4
                  )}, ${parseFloat(story.lon).toFixed(4)}
                </p>
              </div>
              <div id="story-map" class="story-detail-map" aria-label="Map showing story location"></div>
            </div>
          `
              : ""
          }

          <div style="text-align: center; margin-top: 2rem;">
            <button id="backToStoriesButton" class="btn">
              <i class="fas fa-arrow-left" aria-hidden="true"></i>
              Back to Stories
            </button>
          </div>
        </div>
      </div>
    `;
    // Attach event listener for the back button after rendering
    const backButton = document.querySelector("#backToStoriesButton");
    if (backButton) {
      backButton.addEventListener("click", () => {
        this.presenter.onBackToStories();
      });
    }
  },

  showError(message) {
    const container = document.querySelector("#story-detail-content");
    if (!container) return;

    container.innerHTML = `
      <div class="form-container">
        <h2 class="form-title">Error</h2>
        <div class="message error">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          ${message}
        </div>
        <div style="text-align: center; margin-top: 2rem;">
          <button id="goHomeButton" class="btn">
            <i class="fas fa-home" aria-hidden="true"></i>
            Go Home
          </button>
        </div>
      </div>
    `;
    const goHomeButton = document.querySelector("#goHomeButton");
    if (goHomeButton) {
      goHomeButton.addEventListener("click", () => {
        this.navigateToHome(); // View langsung menangani navigasi
      });
    }
  },

  showLoading() {
    const container = document.querySelector("#story-detail-content");
    if (!container) return;

    container.innerHTML = `
      <div class="loading">
        <div class="spinner" aria-hidden="true"></div>
        <span>Loading story details...</span>
      </div>
    `;
  },

  // Metode inisialisasi map dipindahkan ke view
  initializeStoryMap(lat, lon, storyName) {
    setTimeout(() => {
      const mapContainer = document.querySelector("#story-map");
      if (!mapContainer) return;

      // Destroy existing map if any
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

      // Create new map
      this.map = L.map("story-map").setView([lat, lon], 13);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      L.marker([lat, lon])
        .addTo(this.map)
        .bindPopup(
          `
          <div style="text-align: center;">
            <h4 style="margin: 0 0 8px 0;">${storyName}'s Story</h4>
            <p style="margin: 0; font-size: 12px; color: #666;">
              ${lat.toFixed(4)}, ${lon.toFixed(4)}
            </p>
          </div>
          `
        )
        .openPopup();
    }, 100);
  },

  cleanupMap() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },

  // Metode navigasi baru di view
  redirectToLogin() {
    window.location.hash = "#/login";
  },

  redirectToLoginAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/login";
    }, delay);
  },

  navigateToHome() {
    window.location.hash = "#/home";
  },

  redirectToHomeAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/home";
    }, delay);
  },
};

export default StoryDetail;
