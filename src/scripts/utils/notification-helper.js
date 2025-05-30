import ApiService from "../data/api-service.js";
import AuthService from "../data/auth-service.js";

const NotificationHelper = {
  VAPID_PUBLIC_KEY:
    "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk",

  _formatSubscriptionData(subscription) {
    try {
      const subscriptionJSON = subscription.toJSON();

      if (
        !subscriptionJSON.keys ||
        !subscriptionJSON.keys.p256dh ||
        !subscriptionJSON.keys.auth
      ) {
        throw new Error("Subscription keys tidak lengkap");
      }

      return {
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth,
        },
      };
    } catch (error) {
      console.error("Error formatting subscription data:", error);
      throw error;
    }
  },

  async requestPermission() {
    if (!("Notification" in window)) {
      console.warn("Browser ini tidak mendukung notifikasi.");
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Izin notifikasi diberikan.");
      return true;
    } else {
      console.warn("Izin notifikasi ditolak atau diabaikan.");
      return false;
    }
  },

  async registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register(
          "/service-worker.js"
        );
        console.log(
          "Service Worker terdaftar dengan scope:",
          registration.scope
        );
        await navigator.serviceWorker.ready;
        return registration;
      } catch (error) {
        console.error("Pendaftaran Service Worker gagal:", error);
        return null;
      }
    } else {
      console.warn("Service Workers tidak didukung di browser ini.");
      return null;
    }
  },

  async getSubscriptionStatus() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return "unsupported";
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        return "subscribed";
      } else {
        const permission = Notification.permission;
        return permission === "granted"
          ? "granted-no-subscription"
          : permission;
      }
    } catch (error) {
      console.error("Gagal mendapatkan status langganan:", error);
      return "error";
    }
  },

  async subscribeUser() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging tidak didukung.");
      return false;
    }

    try {
      // Request permission first
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        console.log("Permission ditolak");
        return false;
      }

      // Wait for service worker to be ready
      const registration = await navigator.serviceWorker.ready;
      if (!registration) {
        console.error("Service Worker tidak siap");
        return false;
      }

      // Check existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        console.log("Membuat subscription baru...");
        const convertedVapidKey = this._urlB64ToUint8Array(
          this.VAPID_PUBLIC_KEY
        );

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
      }

      // Format and send to server
      const subData = this._formatSubscriptionData(subscription);
      console.log("Sending subscription to server:", subData);

      const apiResponse = await ApiService.subscribePushNotification(subData);

      if (!apiResponse.error) {
        console.log("Subscription berhasil dikirim ke server");
        return true;
      } else {
        console.error("Gagal mengirim subscription:", apiResponse.message);
        return false;
      }
    } catch (error) {
      console.error("Error dalam subscribeUser:", error);
      return false;
    }
  },

  async unsubscribeUser() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging tidak didukung.");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error("Service Worker tidak siap.");
      return false;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        const apiResponse = await ApiService.unsubscribePushNotification(
          endpoint
        );

        if (!apiResponse.error) {
          await subscription.unsubscribe();
          console.log("Berhasil berhenti berlangganan notifikasi push.");
          return true;
        } else {
          console.error(
            "Gagal berhenti berlangganan dari server:",
            apiResponse.message
          );
          return false;
        }
      } else {
        console.log("Tidak ada langganan aktif.");
        return true;
      }
    } catch (error) {
      console.error("Gagal berhenti berlangganan:", error);
      return false;
    }
  },

  async sendTestNotification() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Push messaging tidak didukung.");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error("Service Worker tidak siap.");
      return false;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const subData = this._formatSubscriptionData(subscription);
        const apiResponse = await ApiService.sendTestNotification(subData);
        if (!apiResponse.error) {
          console.log("Notifikasi tes berhasil dikirim.");
          return true;
        } else {
          console.error("Gagal mengirim notifikasi tes:", apiResponse.message);
          return false;
        }
      } else {
        console.warn("Tidak ada langganan push aktif.");
        return false;
      }
    } catch (error) {
      console.error("Tidak dapat mengirim notifikasi tes:", error);
      return false;
    }
  },

  _urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },
};

export default NotificationHelper;
