import HomePresenter from "../../presenters/HomePresenter.js";
import HomeModel from "../../models/HomeModel.js";
import NotificationHelper from "../../utils/notification-helper.js";
import IdbUtils from "../../utils/idb.js"; // Import the IDB utilities

const Home = {
  presenter: null,
  model: null,
  map: null,
  // New property for notification status
  notificationStatus: "default",
  // New property to track current view
  currentView: "latest", // 'latest' or 'favorites'
  currentStories: [], // Cache current stories for favorite operations

  async render() {
    return `
      <div class="story-section">
        <div class="section-header">
          <h2 class="section-title">
            <i class="fas fa-star" aria-hidden="true" style="color: #ffee00;"></i> 
            <span id="section-title-text">Latest Stories</span>
          </h2>
          <p class="section-subtitle">
            <span id="section-subtitle-text">Discover amazing stories from around the world</span>
          </p>
          
          <!-- View Toggle Buttons -->
          <div class="view-toggle">
            <button id="latest-view-btn" class="btn btn-primary active">
              <i class="fas fa-newspaper" aria-hidden="true"></i> Latest Stories
            </button>
            <button id="favorites-view-btn" class="btn btn-secondary">
              <i class="fas fa-heart" aria-hidden="true"></i> My Favorites (<span id="favorites-count">0</span>)
            </button>
            <button id="clear-favorites-btn" class="btn btn-danger" style="display: none;">
              <i class="fas fa-trash" aria-hidden="true"></i> Clear All Favorites
            </button>
          </div>

          <div class="notification-actions">
            <button id="subscribe-push-button" class="btn" style="display: none;">
              <i class="fas fa-bell" aria-hidden="true"></i> Enable Notifications
            </button>
            <button id="unsubscribe-push-button" class="btn btn-secondary" style="display: none;">
              <i class="fas fa-bell-slash" aria-hidden="true"></i> Disable Notifications
            </button>
          </div>
        </div>
        
        <div id="story-list" class="story-list" role="main" aria-label="List of stories">
          <div class="loading">
            <div class="spinner" aria-hidden="true"></div>
            <span>Loading stories...</span>
          </div>
        </div>
      </div>

      <div class="map-container">
        <div class="map-header">
          <h3 class="map-title">
            <i class="fas fa-globe-asia" aria-hidden="true"></i> Story Locations
          </h3>
          <p class="map-subtitle">
            Explore where these amazing stories took place
          </p>
        </div>
        <div id="map" aria-label="Map showing story locations"></div>
      </div>
    `;
  },

  async afterRender() {
    this.model = new HomeModel();
    this.presenter = new HomePresenter(this, this.model);

    // Initialize view toggle buttons
    await this.initViewToggle();

    // Initialize notification buttons
    await this.initNotificationButtons();

    // Update favorites count
    await this.updateFavoritesCount();

    // Start with latest stories
    await this.presenter.init();
  },

  async initViewToggle() {
    const latestBtn = document.getElementById("latest-view-btn");
    const favoritesBtn = document.getElementById("favorites-view-btn");
    const clearFavoritesBtn = document.getElementById("clear-favorites-btn");

    if (latestBtn) {
      latestBtn.addEventListener("click", async () => {
        await this.switchToLatestView();
      });
    }

    if (favoritesBtn) {
      favoritesBtn.addEventListener("click", async () => {
        await this.switchToFavoritesView();
      });
    }

    if (clearFavoritesBtn) {
      clearFavoritesBtn.addEventListener("click", async () => {
        await this.clearAllFavorites();
      });
    }
  },

  async switchToLatestView() {
    this.currentView = "latest";
    this.updateViewButtons();
    this.updateSectionHeader(
      "Latest Stories",
      "Discover amazing stories from around the world"
    );

    // Show loading and fetch latest stories
    this.showLoading();
    await this.presenter.init();
  },

  async switchToFavoritesView() {
    this.currentView = "favorites";
    this.updateViewButtons();
    this.updateSectionHeader(
      "My Favorite Stories",
      "Stories you've saved to read later"
    );

    // Show loading and fetch favorites
    this.showLoading();
    const favoriteStories = await IdbUtils.getAllFavoriteStories();
    this.currentStories = favoriteStories;
    this.renderStories(favoriteStories);
    this.addStoriesToMap(favoriteStories);
  },

  updateViewButtons() {
    const latestBtn = document.getElementById("latest-view-btn");
    const favoritesBtn = document.getElementById("favorites-view-btn");
    const clearBtn = document.getElementById("clear-favorites-btn");

    if (latestBtn && favoritesBtn) {
      if (this.currentView === "latest") {
        latestBtn.classList.add("active", "btn-primary");
        latestBtn.classList.remove("btn-secondary");
        favoritesBtn.classList.remove("active", "btn-primary");
        favoritesBtn.classList.add("btn-secondary");
      } else {
        favoritesBtn.classList.add("active", "btn-primary");
        favoritesBtn.classList.remove("btn-secondary");
        latestBtn.classList.remove("active", "btn-primary");
        latestBtn.classList.add("btn-secondary");
      }
    }

    // Show/hide clear favorites button
    if (clearBtn) {
      clearBtn.style.display =
        this.currentView === "favorites" ? "inline-block" : "none";
    }
  },

  updateSectionHeader(title, subtitle) {
    const titleElement = document.getElementById("section-title-text");
    const subtitleElement = document.getElementById("section-subtitle-text");

    if (titleElement) titleElement.textContent = title;
    if (subtitleElement) subtitleElement.textContent = subtitle;
  },

  async updateFavoritesCount() {
    const count = await IdbUtils.getFavoriteCount();
    const countElement = document.getElementById("favorites-count");
    if (countElement) {
      countElement.textContent = count;
    }
  },

  async clearAllFavorites() {
    if (
      confirm(
        "Are you sure you want to remove all favorite stories? This action cannot be undone."
      )
    ) {
      const success = await IdbUtils.clearAllFavorites();
      if (success) {
        await this.updateFavoritesCount();
        if (this.currentView === "favorites") {
          // Refresh favorites view
          await this.switchToFavoritesView();
        }
        // Show success message
        this.showTemporaryMessage(
          "All favorite stories have been removed.",
          "success"
        );
      } else {
        this.showTemporaryMessage(
          "Failed to clear favorites. Please try again.",
          "error"
        );
      }
    }
  },

  async toggleFavorite(storyId) {
    const story = this.currentStories.find((s) => s.id === storyId);
    if (!story) return;

    const isFavorite = await IdbUtils.isFavoriteStory(storyId);

    if (isFavorite) {
      const success = await IdbUtils.removeFavoriteStory(storyId);
      if (success) {
        this.showTemporaryMessage("Story removed from favorites", "success");
        await this.updateFavoritesCount();

        // If we're in favorites view, refresh the list
        if (this.currentView === "favorites") {
          await this.switchToFavoritesView();
        } else {
          // Update the heart icon for the story
          this.updateFavoriteIcon(storyId, false);
        }
      }
    } else {
      const success = await IdbUtils.addFavoriteStory(story);
      if (success) {
        this.showTemporaryMessage("Story added to favorites", "success");
        await this.updateFavoritesCount();
        this.updateFavoriteIcon(storyId, true);
      }
    }
  },

  updateFavoriteIcon(storyId, isFavorite) {
    const heartBtn = document.querySelector(
      `[data-story-id="${storyId}"] .favorite-btn`
    );
    if (heartBtn) {
      const icon = heartBtn.querySelector("i");
      if (icon) {
        if (isFavorite) {
          icon.classList.remove("far");
          icon.classList.add("fas");
          heartBtn.style.color = "#e74c3c";
        } else {
          icon.classList.remove("fas");
          icon.classList.add("far");
          heartBtn.style.color = "#666";
        }
      }
    }
  },

  showTemporaryMessage(message, type = "info") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `temporary-message ${type}`;
    messageDiv.innerHTML = `
      <i class="fas ${
        type === "success"
          ? "fa-check-circle"
          : type === "error"
          ? "fa-exclamation-circle"
          : "fa-info-circle"
      }" aria-hidden="true"></i>
      ${message}
    `;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${
        type === "success"
          ? "#d4edda"
          : type === "error"
          ? "#f8d7da"
          : "#d1ecf1"
      };
      color: ${
        type === "success"
          ? "#155724"
          : type === "error"
          ? "#721c24"
          : "#0c5460"
      };
      border: 1px solid ${
        type === "success"
          ? "#c3e6cb"
          : type === "error"
          ? "#f5c6cb"
          : "#bee5eb"
      };
      padding: 12px 16px;
      border-radius: 4px;
      z-index: 1000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      max-width: 300px;
    `;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  },

  async initNotificationButtons() {
    this.notificationStatus = await NotificationHelper.getSubscriptionStatus();
    this.updateNotificationButtonVisibility();

    const subscribeButton = document.getElementById("subscribe-push-button");
    const unsubscribeButton = document.getElementById(
      "unsubscribe-push-button"
    );

    if (subscribeButton) {
      subscribeButton.addEventListener("click", async () => {
        const success = await NotificationHelper.subscribeUser();
        if (success) {
          this.notificationStatus = "subscribed";
          this.updateNotificationButtonVisibility();
        }
      });
    }

    if (unsubscribeButton) {
      unsubscribeButton.addEventListener("click", async () => {
        const success = await NotificationHelper.unsubscribeUser();
        if (success) {
          this.notificationStatus = "default";
          this.updateNotificationButtonVisibility();
        }
      });
    }
  },

  updateNotificationButtonVisibility() {
    const subscribeButton = document.getElementById("subscribe-push-button");
    const unsubscribeButton = document.getElementById(
      "unsubscribe-push-button"
    );

    if (subscribeButton) {
      subscribeButton.style.display = "none";
    }
    if (unsubscribeButton) {
      unsubscribeButton.style.display = "none";
    }

    if (
      this.notificationStatus === "default" ||
      this.notificationStatus === "granted-no-subscription"
    ) {
      if (subscribeButton) subscribeButton.style.display = "inline-block";
    } else if (this.notificationStatus === "subscribed") {
      if (unsubscribeButton) unsubscribeButton.style.display = "inline-block";
    } else if (this.notificationStatus === "denied") {
      console.warn(
        "Notifications are denied by the user. Please enable them in your browser settings."
      );
    }
  },

  // View methods called by presenter
  showLoading() {
    const storyListContainer = document.querySelector("#story-list");
    if (storyListContainer) {
      storyListContainer.innerHTML = `
        <div class="loading">
          <div class="spinner" aria-hidden="true"></div>
          <span>Loading stories...</span>
        </div>
      `;
    }
  },

  renderAuthenticationRequired() {
    const storyListContainer = document.querySelector("#story-list");
    const mapContainer = document.querySelector("#map");
    const notificationActions = document.querySelector(".notification-actions");

    if (storyListContainer) {
      storyListContainer.innerHTML = `
        <div class="message error" style="grid-column: 1 / -1;">
          <i class="fas fa-lock" aria-hidden="true"></i>
          You need to login to view stories.
          <div style="margin-top: 1rem;">
            <a href="#/login" class="btn">
              <i class="fas fa-sign-in-alt" aria-hidden="true"></i>
              Login Now
            </a>
          </div>
        </div>
      `;
    }

    if (mapContainer) {
      mapContainer.innerHTML = `
        <div class="message" style="height: 300px; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center;">
            <i class="fas fa-lock" style="font-size: 2rem; color: #ccc; margin-bottom: 1rem;" aria-hidden="true"></i>
            <p>Login required to view story locations</p>
          </div>
        </div>
      `;
    }
    // Hide notification buttons if authentication is required
    if (notificationActions) {
      notificationActions.style.display = "none";
    }
  },

  async renderStories(stories) {
    const storyListContainer = document.querySelector("#story-list");
    const notificationActions = document.querySelector(".notification-actions");

    if (!storyListContainer) return;

    // Store current stories for favorite operations
    this.currentStories = stories;

    if (stories.length === 0) {
      const emptyMessage =
        this.currentView === "favorites"
          ? "No favorite stories yet. Start adding stories to your favorites!"
          : "No stories available yet. Be the first to share your story!";

      storyListContainer.innerHTML = `
        <div class="message" style="grid-column: 1 / -1;">
          <i class="fas ${
            this.currentView === "favorites" ? "fa-heart" : "fa-info-circle"
          }" aria-hidden="true"></i>
          ${emptyMessage}
        </div>
      `;
      return;
    }

    // Check favorite status for each story
    const storiesWithFavoriteStatus = await Promise.all(
      stories.map(async (story) => ({
        ...story,
        isFavorite: await IdbUtils.isFavoriteStory(story.id),
      }))
    );

    const storiesHTML = storiesWithFavoriteStatus
      .map(
        (story) => `
        <article class="story-item" role="article" data-story-id="${
          story.id
        }" tabindex="0">
          <div class="story-header">
            <div class="story-avatar" aria-hidden="true">
              ${story.name ? story.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div class="story-meta">
              <h3>${story.name || "Anonymous"}</h3>
              <div class="story-date">
                <i class="fas fa-calendar-alt" aria-hidden="true"></i>
                <time datetime="${story.createdAt}">
                  ${this.presenter.formatDate(story.createdAt)}
                </time>
              </div>
            </div>
            <button class="favorite-btn" data-story-id="${story.id}" title="${
          story.isFavorite ? "Remove from favorites" : "Add to favorites"
        }"
                    style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: ${
                      story.isFavorite ? "#e74c3c" : "#666"
                    }; padding: 5px;">
              <i class="${
                story.isFavorite ? "fas" : "far"
              } fa-heart" aria-hidden="true"></i>
            </button>
          </div>
          <div class="story-content">
            <img
              src="${story.photoUrl}"
              alt="Story image by ${story.name || "Anonymous"}"
              class="story-image"
              loading="lazy"
            />
            <p>${this.presenter.truncateText(story.description, 35)}</p>
            ${
              story.lat && story.lon
                ? `
              <div class="story-location">
                <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                <span>Lat: ${parseFloat(story.lat).toFixed(
                  4
                )}, Lon: ${parseFloat(story.lon).toFixed(4)}</span>
              </div>
            `
                : ""
            }
          </div>
        </article>
      `
      )
      .join("");

    storyListContainer.innerHTML = storiesHTML;

    this.attachStoryEventListeners();

    // Ensure notification buttons are visible if stories are rendered (user is logged in)
    if (notificationActions) {
      notificationActions.style.display = "block";
    }
  },

  attachStoryEventListeners() {
    const storyItems = document.querySelectorAll(".story-item");
    storyItems.forEach((item) => {
      // Story click handler (excluding favorite button)
      item.addEventListener("click", (e) => {
        // Don't navigate if favorite button was clicked
        if (e.target.closest(".favorite-btn")) return;

        const storyId = item.dataset.storyId;
        this.presenter.onStoryClick(storyId);
      });

      // Keyboard navigation
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const storyId = item.dataset.storyId;
          this.presenter.onStoryClick(storyId);
        }
      });
    });

    // Favorite button handlers
    const favoriteButtons = document.querySelectorAll(".favorite-btn");
    favoriteButtons.forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Prevent story navigation
        const storyId = btn.dataset.storyId;
        await this.toggleFavorite(storyId);
      });
    });
  },

  showError(message) {
    const storyListContainer = document.querySelector("#story-list");
    const notificationActions = document.querySelector(".notification-actions");
    if (storyListContainer) {
      storyListContainer.innerHTML = `
        <div class="message error">
          <i class="fas fa-exclamation-triangle" aria-hidden="true"></i>
          ${message}
        </div>
      `;
    }
    // Hide notification buttons if there's an error
    if (notificationActions) {
      notificationActions.style.display = "none";
    }
  },

  initializeMap() {
    try {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      this.map = L.map("map").setView([-2.5489, 118.0149], 5);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      const mapContainer = document.querySelector("#map");
      if (mapContainer) {
        mapContainer.innerHTML = `
          <div class="message error" style="height: 300px; display: flex; align-items: center; justify-content: center;">
            <div style="text-align: center;">
              <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #dc2626; margin-bottom: 1rem;" aria-hidden="true"></i>
              <p>Error loading map. Please try again later.</p>
            </div>
          </div>
        `;
      }
    }
  },

  addStoriesToMap(stories) {
    if (!this.map) {
      console.error("Map not initialized, cannot add stories.");
      return;
    }

    console.log("Adding stories to map:", stories.length);

    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer);
      }
    });

    let markersAdded = 0;
    const bounds = [];

    stories.forEach((story) => {
      if (story.lat && story.lon) {
        try {
          const lat = parseFloat(story.lat);
          const lon = parseFloat(story.lon);

          if (
            isNaN(lat) ||
            isNaN(lon) ||
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
          ) {
            console.warn(
              `Invalid coordinates for story ${story.id}:`,
              lat,
              lon
            );
            return;
          }

          const marker = L.marker([lat, lon]).addTo(this.map);
          bounds.push([lat, lon]);
          markersAdded++;

          const popupContent = `
            <div style="max-width: 250px;">
              <img src="${story.photoUrl}" alt="Story by ${
            story.name || "Anonymous"
          }"
                    style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;"
                    onerror="this.style.display='none';">
              <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold;">${
                story.name || "Anonymous"
              }</h4>
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #666; line-height: 1.3;">
                ${this.presenter.truncateText(story.description, 80)}
              </p>
              <div style="text-align: center;">
                <button onclick="window.location.hash='#/story/${story.id}'"
                        style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none;
                               padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer;
                               transition: opacity 0.2s;"
                        onmouseover="this.style.opacity='0.8'"
                        onmouseout="this.style.opacity='1'">
                  Read More
                </button>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);

          marker.bindTooltip(story.name || "Anonymous Story", {
            permanent: false,
            direction: "top",
            offset: [0, -10],
          });
        } catch (error) {
          console.error(`Error adding marker for story ${story.id}:`, error);
        }
      }
    });

    console.log(`Added ${markersAdded} markers to map`);

    if (bounds.length > 0) {
      try {
        if (bounds.length === 1) {
          this.map.setView(bounds[0], 10);
        } else {
          this.map.fitBounds(bounds, { padding: [20, 20] });
        }
      } catch (error) {
        console.error("Error fitting map bounds:", error);
      }
    }

    this.updateMapInfo(markersAdded, stories.length);
  },

  updateMapInfo(markersCount, totalStories) {
    const mapHeader = document.querySelector(".map-subtitle");
    if (mapHeader) {
      const viewText = this.currentView === "favorites" ? "favorite" : "";
      if (markersCount === 0) {
        mapHeader.textContent = `No ${viewText} story locations available`;
      } else if (markersCount === totalStories) {
        mapHeader.textContent = `Showing ${markersCount} ${viewText} story locations`;
      } else {
        mapHeader.textContent = `Showing ${markersCount} of ${totalStories} ${viewText} story locations`;
      }
    }
  },

  redirectToLogin() {
    window.location.hash = "#/login";
  },

  redirectToLoginAfterDelay(delay) {
    setTimeout(() => {
      window.location.hash = "#/login";
    }, delay);
  },

  navigateToStoryDetail(storyId) {
    window.location.hash = `#/story/${storyId}`;
  },
};

export default Home;
