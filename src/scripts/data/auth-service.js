const TOKEN_KEY = "token"; // Gunakan konstanta agar mudah diubah di satu tempat

const AuthService = {
  /**
   * Menyimpan token autentikasi ke localStorage
   * @param {string} token - Token autentikasi
   */
  saveToken(token) {
    if (typeof token === "string") {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      console.warn("AuthService: Token harus berupa string.");
    }
  },

  /**
   * Mengambil token autentikasi dari localStorage
   * @returns {string|null} Token atau null jika tidak ditemukan
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Menghapus token autentikasi dari localStorage
   */
  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  /**
   * Mengecek apakah pengguna sudah login
   * @returns {boolean} True jika token tersedia, false jika tidak
   */
  isLoggedIn() {
    const token = this.getToken();
    return !!token;
  },

  /**
   * Melakukan logout pengguna (menghapus token dan arahkan ke login jika diperlukan)
   * @param {boolean} redirectToLogin - Apakah akan redirect ke halaman login (default: false)
   */
  logout(redirectToLogin = false) {
    this.removeToken();
    if (redirectToLogin) {
      window.location.hash = "#/login";
    }
  },

  /**
   * Mengecek apakah pengguna terautentikasi, jika tidak redirect ke login
   * @returns {boolean} True jika login, false jika tidak dan sudah diarahkan ke login
   */
  requireAuth() {
    if (!this.isLoggedIn()) {
      this.logout(true);
      return false;
    }
    return true;
  },
};

export default AuthService;
