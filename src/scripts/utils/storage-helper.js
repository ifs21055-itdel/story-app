class StorageHelper {
  // Throttle mechanism to prevent too frequent writes
  static _writeThrottle = new Map();
  static _throttleDelay = 1000; // 1 second

  static _throttledWrite(key, value) {
    // Clear existing timeout for this key
    if (this._writeThrottle.has(key)) {
      clearTimeout(this._writeThrottle.get(key));
    }

    // Set new timeout
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, value);
        this._writeThrottle.delete(key);
      } catch (error) {
        console.error(`Failed to write to localStorage: ${key}`, error);
      }
    }, this._throttleDelay);

    this._writeThrottle.set(key, timeoutId);
  }

  static _safeRead(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Failed to read from localStorage: ${key}`, error);
      return null;
    }
  }

  static _safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage: ${key}`, error);
    }
  }

  // Token management
  static saveToken(token) {
    if (!token) return;
    try {
      localStorage.setItem("auth_token", token);
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  }

  static getToken() {
    return this._safeRead("auth_token");
  }

  static removeToken() {
    this._safeRemove("auth_token");
  }

  // User data management
  static saveUserData(userData) {
    if (!userData) return;
    try {
      localStorage.setItem("user_data", JSON.stringify(userData));
    } catch (error) {
      console.error("Failed to save user data:", error);
    }
  }

  static getUserData() {
    const userData = this._safeRead("user_data");
    try {
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Failed to parse user data:", error);
      return null;
    }
  }

  static removeUserData() {
    this._safeRemove("user_data");
  }

  // Cache management with improved TTL handling
  static saveStoriesCache(stories) {
    if (!stories || !Array.isArray(stories)) return;

    const cacheData = {
      stories,
      timestamp: Date.now(),
      ttl: 5 * 60 * 1000, // 5 minutes TTL
    };

    // Use throttled write to prevent frequent updates
    this._throttledWrite("stories_cache", JSON.stringify(cacheData));
  }

  static getStoriesCache() {
    const cacheData = this._safeRead("stories_cache");
    if (!cacheData) return null;

    try {
      const parsed = JSON.parse(cacheData);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp > parsed.ttl) {
        // Don't remove immediately, just return null
        // Removal will be handled by cleanup method
        return null;
      }

      return parsed.stories;
    } catch (error) {
      console.error("Failed to parse stories cache:", error);
      this._safeRemove("stories_cache");
      return null;
    }
  }

  static removeStoriesCache() {
    this._safeRemove("stories_cache");
  }

  static saveStoryCache(storyId, story) {
    if (!storyId || !story) return;

    const cacheKey = `story_${storyId}`;
    const cacheData = {
      story,
      timestamp: Date.now(),
      ttl: 10 * 60 * 1000, // 10 minutes TTL
    };

    // Use throttled write
    this._throttledWrite(cacheKey, JSON.stringify(cacheData));
  }

  static getStoryCache(storyId) {
    if (!storyId) return null;

    const cacheKey = `story_${storyId}`;
    const cacheData = this._safeRead(cacheKey);
    if (!cacheData) return null;

    try {
      const parsed = JSON.parse(cacheData);
      const now = Date.now();

      // Check if cache is still valid
      if (now - parsed.timestamp > parsed.ttl) {
        return null;
      }

      return parsed.story;
    } catch (error) {
      console.error("Failed to parse story cache:", error);
      this._safeRemove(cacheKey);
      return null;
    }
  }

  // Pending actions with improved handling
  static savePendingAction(action) {
    if (!action) return;

    try {
      const pendingActions = this.getPendingActions();
      const newAction = {
        ...action,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };

      pendingActions.push(newAction);

      // Limit pending actions to prevent memory issues
      if (pendingActions.length > 50) {
        pendingActions.shift(); // Remove oldest
      }

      localStorage.setItem("pending_actions", JSON.stringify(pendingActions));
    } catch (error) {
      console.error("Failed to save pending action:", error);
    }
  }

  static getPendingActions() {
    try {
      const actions = this._safeRead("pending_actions");
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error("Failed to parse pending actions:", error);
      return [];
    }
  }

  static removePendingAction(actionId) {
    if (!actionId) return;

    try {
      const pendingActions = this.getPendingActions();
      const filteredActions = pendingActions.filter(
        (action) => action.id !== actionId
      );
      localStorage.setItem("pending_actions", JSON.stringify(filteredActions));
    } catch (error) {
      console.error("Failed to remove pending action:", error);
    }
  }

  static clearPendingActions() {
    this._safeRemove("pending_actions");
  }

  // Network status with debouncing
  static _networkStatusDebounce = null;

  static setNetworkStatus(isOnline) {
    // Debounce network status updates to prevent frequent writes
    if (this._networkStatusDebounce) {
      clearTimeout(this._networkStatusDebounce);
    }

    this._networkStatusDebounce = setTimeout(() => {
      try {
        const currentStatus = this.getNetworkStatus();
        // Only update if status actually changed
        if (currentStatus !== isOnline) {
          localStorage.setItem("network_status", isOnline.toString());
        }
      } catch (error) {
        console.error("Failed to set network status:", error);
      }
    }, 500); // 500ms debounce
  }

  static getNetworkStatus() {
    const status = this._safeRead("network_status");
    // Default to online if not set
    return status !== null ? status === "true" : true;
  }

  // App settings
  static saveAppSettings(settings) {
    if (!settings) return;

    try {
      const currentSettings = this.getAppSettings();
      const newSettings = { ...currentSettings, ...settings };
      localStorage.setItem("app_settings", JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save app settings:", error);
    }
  }

  static getAppSettings() {
    try {
      const settings = this._safeRead("app_settings");
      return settings
        ? JSON.parse(settings)
        : {
            theme: "light",
            notifications: true,
            autoSync: true,
          };
    } catch (error) {
      console.error("Failed to parse app settings:", error);
      return {
        theme: "light",
        notifications: true,
        autoSync: true,
      };
    }
  }

  // Cache cleanup method
  static cleanupExpiredCache() {
    try {
      const now = Date.now();
      const keysToRemove = [];

      // Check all localStorage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Skip non-cache keys
        if (!key || (!key.includes("cache") && !key.startsWith("story_"))) {
          continue;
        }

        const data = this._safeRead(key);
        if (!data) continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.timestamp && parsed.ttl) {
            if (now - parsed.timestamp > parsed.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          // Invalid cache data, mark for removal
          keysToRemove.push(key);
        }
      }

      // Remove expired cache entries
      keysToRemove.forEach((key) => this._safeRemove(key));

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.error("Failed to cleanup expired cache:", error);
    }
  }

  // Clear all data with improved error handling
  static clearAllData() {
    const keysToRemove = [
      "auth_token",
      "user_data",
      "stories_cache",
      "pending_actions",
      "network_status",
    ];

    // Clear throttled writes
    this._writeThrottle.forEach((timeoutId) => clearTimeout(timeoutId));
    this._writeThrottle.clear();

    // Clear network status debounce
    if (this._networkStatusDebounce) {
      clearTimeout(this._networkStatusDebounce);
      this._networkStatusDebounce = null;
    }

    try {
      keysToRemove.forEach((key) => {
        this._safeRemove(key);
      });

      // Remove all story caches
      const keysToCheck = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("story_")) {
          keysToCheck.push(key);
        }
      }

      keysToCheck.forEach((key) => this._safeRemove(key));
    } catch (error) {
      console.error("Failed to clear all data:", error);
    }
  }

  // Initialize cleanup interval
  static initCleanup() {
    // Run cleanup every 10 minutes
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 10 * 60 * 1000);

    // Run initial cleanup after 30 seconds
    setTimeout(() => {
      this.cleanupExpiredCache();
    }, 30000);
  }
}

export default StorageHelper;
