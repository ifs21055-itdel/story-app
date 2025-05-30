const BASE_URL = "https://story-api.dicoding.dev/v1";

// Fungsi untuk mendapatkan header otorisasi (Bearer Token)
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Fungsi untuk mengecek apakah error adalah authentication error
const isAuthError = (error, response) => {
  return (
    response?.status === 401 ||
    response?.status === 403 ||
    error?.message?.toLowerCase().includes("token") ||
    error?.message?.toLowerCase().includes("unauthorized") ||
    error?.message?.toLowerCase().includes("forbidden")
  );
};

// Objek yang berisi semua fungsi untuk interaksi API
const ApiService = {
  // ... (Your existing register, login, getAllStories, getStoryById, addStory, addStoryGuest methods remain unchanged)

  /**
   * Mendaftarkan pengguna baru.
   * @param {object} data - Objek berisi nama, email, dan password.
   * @returns {Promise<object>} - Objek respons dari API.
   */
  async register({ name, email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Registrasi gagal.");
      }
      return responseData;
    } catch (error) {
      console.error("API Error - register:", error);
      return {
        error: true,
        message: error.message || "Terjadi kesalahan saat registrasi.",
      };
    }
  },

  /**
   * Melakukan login pengguna.
   * @param {object} data - Objek berisi email dan password.
   * @returns {Promise<object>} - Objek respons dari API.
   */
  async login({ email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Login gagal.");
      }
      return responseData;
    } catch (error) {
      console.error("API Error - login:", error);
      return {
        error: true,
        message: error.message || "Terjadi kesalahan saat login.",
      };
    }
  },

  /**
   * Mengambil semua cerita.
   * @param {number} page - Nomor halaman (default 1).
   * @param {number} size - Jumlah cerita per halaman (default 10).
   * @param {number} location - Filter cerita berdasarkan lokasi (0 atau 1, default 0).
   * @returns {Promise<object>} - Objek respons dari API.
   */
  async getAllStories(page = 1, size = 10, location = 0) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login.");
      }

      const response = await fetch(
        `${BASE_URL}/stories?page=${page}&size=${size}&location=${location}`,
        {
          headers: getAuthHeaders(),
        }
      );
      const responseData = await response.json();

      if (!response.ok) {
        if (isAuthError(responseData, response)) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(
          responseData.message || "Gagal mengambil daftar cerita."
        );
      }
      return responseData;
    } catch (error) {
      console.error("API Error - getAllStories:", error);
      if (
        error.message.includes("session has expired") ||
        error.message.includes("Authentication token not found")
      ) {
        localStorage.removeItem("token");
      }
      return {
        error: true,
        message: error.message || "Terjadi kesalahan saat mengambil cerita.",
      };
    }
  },

  /**
   * Mengambil detail cerita berdasarkan ID.
   * @param {string} id - ID cerita yang ingin diambil detailnya.
   * @returns {Promise<object>} - Objek respons dari API.
   */
  async getStoryById(id) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login.");
      }

      const response = await fetch(`${BASE_URL}/stories/${id}`, {
        headers: getAuthHeaders(),
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (isAuthError(responseData, response)) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(
          responseData.message ||
            `Gagal mengambil detail cerita dengan ID ${id}.`
        );
      }
      return responseData;
    } catch (error) {
      console.error(`API Error - getStoryById(${id}):`, error);
      if (
        error.message.includes("session has expired") ||
        error.message.includes("Authentication token not found")
      ) {
        localStorage.removeItem("token");
      }
      return {
        error: true,
        message:
          error.message ||
          `Terjadi kesalahan saat mengambil detail cerita dengan ID ${id}.`,
      };
    }
  },

  /**
   * Menambahkan cerita baru.
   * @param {object} data - Objek berisi deskripsi, foto (File), lat, dan lon.
   * @returns {Promise<object>} - Objek respons dari API.
   */
  async addStory({ description, photo, lat, lon }) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login.");
      }

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);
      if (lat !== undefined && lon !== undefined) {
        formData.append("lat", lat);
        formData.append("lon", lon);
      }

      const response = await fetch(`${BASE_URL}/stories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (isAuthError(responseData, response)) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(responseData.message || "Gagal menambahkan cerita.");
      }
      return responseData;
    } catch (error) {
      console.error("API Error - addStory:", error);
      if (
        error.message.includes("session has expired") ||
        error.message.includes("Authentication token not found")
      ) {
        localStorage.removeItem("token");
      }
      return {
        error: true,
        message: error.message || "Terjadi kesalahan saat menambahkan cerita.",
      };
    }
  },

  /**
   * Menambahkan cerita baru sebagai tamu (tanpa otentikasi).
   * @param {object} data - Objek berisi deskripsi, foto (File), lat, dan lon.
   * @returns {Promise<object>} - Objek respons dari API.
   */
  async addStoryGuest({ description, photo, lat, lon }) {
    const formData = new FormData();
    formData.append("description", description);
    formData.append("photo", photo);
    if (lat !== undefined && lon !== undefined) {
      formData.append("lat", lat);
      formData.append("lon", lon);
    }

    try {
      const response = await fetch(`${BASE_URL}/stories/guest`, {
        method: "POST",
        body: formData,
      });
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData.message || "Gagal menambahkan cerita tamu."
        );
      }
      return responseData;
    } catch (error) {
      console.error("API Error - addStoryGuest:", error);
      return {
        error: true,
        message:
          error.message || "Terjadi kesalahan saat menambahkan cerita tamu.",
      };
    }
  },

  // --- NEW: API methods for Push Notifications ---
  async subscribePushNotification(subscription) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login.");
      }

      const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(subscription), // Expects { endpoint, keys: { p256dh, auth } }
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (isAuthError(responseData, response)) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(
          responseData.message || "Gagal mendaftar push notification."
        );
      }
      return responseData;
    } catch (error) {
      console.error("API Error - subscribePushNotification:", error);
      return {
        error: true,
        message:
          error.message ||
          "Terjadi kesalahan saat mendaftar push notification.",
      };
    }
  },

  async unsubscribePushNotification(endpoint) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login.");
      }

      const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
        // Note: The endpoint is the same for DELETE
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ endpoint }), // Only send the endpoint for unsubscription
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (isAuthError(responseData, response)) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(
          responseData.message || "Gagal berhenti mendaftar push notification."
        );
      }
      return responseData;
    } catch (error) {
      console.error("API Error - unsubscribePushNotification:", error);
      return {
        error: true,
        message:
          error.message ||
          "Terjadi kesalahan saat berhenti mendaftar push notification.",
      };
    }
  },

  async sendTestNotification(subscription) {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login.");
      }

      const response = await fetch(`${BASE_URL}/notifications/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(subscription), // The test endpoint often expects the full subscription
      });
      const responseData = await response.json();

      if (!response.ok) {
        if (isAuthError(responseData, response)) {
          localStorage.removeItem("token");
          throw new Error("Your session has expired. Please login again.");
        }
        throw new Error(
          responseData.message || "Gagal mengirim notifikasi tes."
        );
      }
      return responseData;
    } catch (error) {
      console.error("API Error - sendTestNotification:", error);
      return {
        error: true,
        message:
          error.message || "Terjadi kesalahan saat mengirim notifikasi tes.",
      };
    }
  },
};

export default ApiService;
