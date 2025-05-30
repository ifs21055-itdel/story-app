import UrlParser from "../routes/url-parser.js";
import routes from "../routes/routes.js";
import AuthService from "../data/auth-service.js";
import StorageHelper from "../utils/storage-helper.js"; // Pastikan StorageHelper memiliki initCleanup() jika Anda menambahkannya

class App {
  constructor({ content }) {
    this._content = content;
    this._isRendering = false;
    this._renderQueue = [];

    // Initialize storage cleanup (pastikan metode ini ada di StorageHelper)
    // StorageHelper.initCleanup(); // Aktifkan jika Anda telah menambahkan metode ini di StorageHelper

    this._initialAppShell();
    this._initPWAFeatures();
  }

  _initialAppShell() {
    this._updateNavigation();

    const logoutButton = document.querySelector("#logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", async (e) => {
        e.preventDefault();
        AuthService.logout();
        this._updateNavigation();
        window.location.hash = "#/home";
        await this.renderPage();
      });
    }
  }

  _initPWAFeatures() {
    // Initialize offline functionality
    this._initOfflineSync();

    // Initialize network status monitoring
    this._initNetworkMonitoring();

    // Initialize background sync (if supported)
    this._initBackgroundSync();
  }

  _initOfflineSync() {
    // Process pending actions when online
    window.addEventListener("online", () => {
      this._processPendingActions();
    });

    // Check for pending actions on app start
    if (navigator.onLine) {
      this._processPendingActions();
    }
  }

  _initNetworkMonitoring() {
    let isOnline = navigator.onLine; // Tambahkan state untuk status online

    const updateNetworkStatus = () => {
      const newStatus = navigator.onLine;

      // Only update if status actually changed
      if (newStatus !== isOnline) {
        isOnline = newStatus;
        StorageHelper.setNetworkStatus(newStatus);
        // Update UI indicators
        const offlineIndicator = document.querySelector("#offline-indicator");
        if (offlineIndicator) {
          offlineIndicator.style.display = newStatus ? "none" : "block";
        }
        console.log(
          `Network status changed: ${newStatus ? "online" : "offline"}`
        );
      }
    };

    // Debounce network events to prevent rapid firing
    let networkTimeout;
    const debouncedUpdate = () => {
      if (networkTimeout) clearTimeout(networkTimeout);
      networkTimeout = setTimeout(updateNetworkStatus, 100);
    };

    window.addEventListener("online", debouncedUpdate);
    window.addEventListener("offline", debouncedUpdate);

    // Initial status
    updateNetworkStatus();
  }

  _initBackgroundSync() {
    // Register background sync if service worker and sync are supported
    if (
      "serviceWorker" in navigator &&
      "sync" in window.ServiceWorkerRegistration.prototype
    ) {
      navigator.serviceWorker.ready.then((registration) => {
        // Background sync will be handled by service worker
        console.log("Background sync is available");
      });
    }
  }

  async _processPendingActions() {
    const pendingActions = StorageHelper.getPendingActions();

    for (const action of pendingActions) {
      try {
        await this._executePendingAction(action);
        StorageHelper.removePendingAction(action.id);
      } catch (error) {
        console.error("Failed to process pending action:", error);
        // Keep action for retry later if it failed
      }
    }
  }

  async _executePendingAction(action) {
    switch (action.type) {
      case "ADD_STORY":
        // Re-attempt to add story
        const StoryService = (await import("../data/api-service.js"))
          .ApiService; // Menggunakan ApiService
        await StoryService.addStory(action.data);
        break;

      case "UPDATE_PROFILE":
        // Re-attempt to update profile
        await AuthService.updateProfile(action.data);
        break;

      default:
        console.warn("Unknown pending action type:", action.type);
    }
  }

  _updateNavigation() {
    const isLoggedIn = AuthService.isLoggedIn();
    const loginLink = document.querySelector("#login-link");
    const registerLink = document.querySelector("#register-link");
    const logoutButton = document.querySelector("#logout-button");

    if (isLoggedIn) {
      if (loginLink) loginLink.style.display = "none";
      if (registerLink) registerLink.style.display = "none";
      if (logoutButton) logoutButton.style.display = "block";
    } else {
      if (loginLink) loginLink.style.display = "block";
      if (registerLink) registerLink.style.display = "block";
      if (logoutButton) logoutButton.style.display = "none";
    }
  }

  // Metode renderPage baru menggunakan antrean
  async renderPage() {
    // Queue-based rendering to prevent overlapping renders
    return new Promise((resolve) => {
      this._renderQueue.push(resolve);
      this._processRenderQueue();
    });
  }

  async _processRenderQueue() {
    if (this._isRendering || this._renderQueue.length === 0) {
      return;
    }
    this._isRendering = true;
    const resolve = this._renderQueue.shift();
    try {
      await this._doRender();
      resolve();
    } catch (error) {
      console.error("Error in render process:", error);
      resolve(); // Resolve even on error to unblock the queue
    } finally {
      this._isRendering = false;

      // Process next in queue if any
      if (this._renderQueue.length > 0) {
        // Use setTimeout to avoid blocking the main thread and allow other events to run
        setTimeout(() => this._processRenderQueue(), 0);
      }
    }
  }

  async _doRender() {
    // Show loading indicator
    this._showLoading();
    try {
      const url = UrlParser.parseActiveUrlWithCombiner();
      const page = routes[url];
      if (page) {
        // Check if page requires authentication
        if (page.requiresAuth && !AuthService.isLoggedIn()) {
          window.location.hash = "#/login";
          return; // Stop rendering and redirect
        }
        // Use View Transition API if available
        if ("startViewTransition" in document) {
          await document.startViewTransition(async () => {
            this._content.innerHTML = await page.render();
            await page.afterRender();
          }).finished;
        } else {
          this._content.innerHTML = await page.render();
          await page.afterRender();
        }
      } else {
        // 404 page
        this._content.innerHTML = `
          <div class="form-container">
            <h2 class="form-title">Page Not Found</h2>
            <p style="text-align: center; margin-bottom: 2rem;">The page you're looking for doesn't exist.</p>
            <div style="text-align: center;">
              <a href="#/home" class="btn">
                <i class="fas fa-home"></i> Go Home
              </a>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error("Error rendering page:", error);
      this._renderOfflineFallback();
    } finally {
      // Hide loading indicator
      this._hideLoading();
      // Update navigation after rendering
      this._updateNavigation();
    }
  }

  _renderOfflineFallback() {
    const isOffline = !navigator.onLine;

    this._content.innerHTML = `
      <div class="form-container">
        <h2 class="form-title">${isOffline ? "You're Offline" : "Error"}</h2>
        <div class="message ${isOffline ? "warning" : "error"}">
          ${
            isOffline
              ? "Please check your internet connection and try again."
              : "Something went wrong. Please try again later."
          }
        </div>
        <div style="text-align: center; margin-top: 1rem;">
          <a href="#/home" class="btn">
            <i class="fas fa-home"></i> Go Home
          </a>
        </div>
      </div>
    `;
  }

  _showLoading() {
    const loadingIndicator = document.querySelector("#loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "flex";
    }
  }

  _hideLoading() {
    const loadingIndicator = document.querySelector("#loading-indicator");
    if (loadingIndicator) {
      loadingIndicator.style.display = "none";
    }
  }

  // PWA-specific methods
  async cacheCurrentPage() {
    if ("caches" in window) {
      const cache = await caches.open("dicoding-story-pages");
      await cache.add(window.location.href);
    }
  }

  async clearCache() {
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }
  }
}

export default App;
