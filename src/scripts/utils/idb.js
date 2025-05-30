// idb.js
import { openDB } from "idb";

const DB_NAME = "story-db";
const FAVORITE_STORE = "favorite-stories";

const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      // Create favorite stories store
      if (!db.objectStoreNames.contains(FAVORITE_STORE)) {
        const favoriteStore = db.createObjectStore(FAVORITE_STORE, {
          keyPath: "id",
        });
        // Add index for faster searching by story properties
        favoriteStore.createIndex("name", "name", { unique: false });
        favoriteStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    },
  });
};

const IdbUtils = {
  // Favorite Stories Operations
  async addFavoriteStory(story) {
    try {
      const db = await initDB();
      const tx = db.transaction(FAVORITE_STORE, "readwrite");
      const store = tx.objectStore(FAVORITE_STORE);

      // Add timestamp when favorited and ensure all required fields
      const favoriteStory = {
        ...story,
        favoritedAt: new Date().toISOString(),
        isFavorite: true,
      };

      await store.put(favoriteStory);
      await tx.done;
      console.log("Story added to favorites:", story.id);
      return true;
    } catch (error) {
      console.error("Error adding story to favorites:", error);
      return false;
    }
  },

  async removeFavoriteStory(storyId) {
    try {
      const db = await initDB();
      const tx = db.transaction(FAVORITE_STORE, "readwrite");
      const store = tx.objectStore(FAVORITE_STORE);

      await store.delete(storyId);
      await tx.done;
      console.log("Story removed from favorites:", storyId);
      return true;
    } catch (error) {
      console.error("Error removing story from favorites:", error);
      return false;
    }
  },

  async getAllFavoriteStories() {
    try {
      const db = await initDB();
      const stories = await db.getAll(FAVORITE_STORE);
      // Sort by favorited date (newest first)
      return stories.sort(
        (a, b) => new Date(b.favoritedAt) - new Date(a.favoritedAt)
      );
    } catch (error) {
      console.error("Error getting favorite stories:", error);
      return [];
    }
  },

  async getFavoriteStory(storyId) {
    try {
      const db = await initDB();
      return await db.get(FAVORITE_STORE, storyId);
    } catch (error) {
      console.error("Error getting favorite story:", error);
      return null;
    }
  },

  async isFavoriteStory(storyId) {
    try {
      const story = await this.getFavoriteStory(storyId);
      return story !== undefined;
    } catch (error) {
      console.error("Error checking if story is favorite:", error);
      return false;
    }
  },

  async clearAllFavorites() {
    try {
      const db = await initDB();
      const tx = db.transaction(FAVORITE_STORE, "readwrite");
      await tx.objectStore(FAVORITE_STORE).clear();
      await tx.done;
      console.log("All favorite stories cleared");
      return true;
    } catch (error) {
      console.error("Error clearing favorite stories:", error);
      return false;
    }
  },

  async getFavoriteCount() {
    try {
      const db = await initDB();
      return await db.count(FAVORITE_STORE);
    } catch (error) {
      console.error("Error getting favorite count:", error);
      return 0;
    }
  },

  // Legacy methods (keep for backward compatibility if needed)
  async saveStories(stories = []) {
    console.warn(
      "saveStories is deprecated. Use favorite story methods instead."
    );
    // You can remove this if not needed elsewhere
  },

  async getAllStories() {
    console.warn(
      "getAllStories is deprecated. Use getAllFavoriteStories instead."
    );
    return this.getAllFavoriteStories();
  },

  async deleteAllStories() {
    console.warn(
      "deleteAllStories is deprecated. Use clearAllFavorites instead."
    );
    return this.clearAllFavorites();
  },
};

export default IdbUtils;
