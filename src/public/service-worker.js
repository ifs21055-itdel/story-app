const CACHE_NAME = "dicoding-story-v1";
const urlsToCache = [
  // Hapus index.html dan index.js dari daftar ini.
  // Kita akan menangani mereka secara terpisah dengan strategi "Network-First".
  // Pertahankan aset statis lain yang jarang berubah di sini.
  "/", // Ini sering merujuk ke index.html, tapi akan kita tangani di fetch
  "/manifest.json",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-32x32.png",
  "/icons/icon-16x16.png",
  "/src/styles/main.css", // Contoh: jika CSS Anda statis
  // Tambahkan aset statis lainnya di sini (gambar, font, dll.)
];

// Install event - cache resources statis
self.addEventListener("install", (event) => {
  console.log("Service Worker menginstal...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache dibuka");
        // Filter URL yang akan di-cache untuk memastikan hanya sumber daya lokal
        const localUrls = urlsToCache.filter((url) => !url.startsWith("http"));
        return cache.addAll(localUrls);
      })
      .catch((error) => {
        console.error("Gagal meng-cache sumber daya saat instalasi:", error);
        // Jangan biarkan instalasi gagal jika caching gagal
        return Promise.resolve();
      })
  );
  self.skipWaiting(); // Memaksa Service Worker baru untuk segera aktif
});

// Activate event - membersihkan cache lama
self.addEventListener("activate", (event) => {
  console.log("Service Worker mengaktifkan...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Menghapus cache lama:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Pastikan Service Worker mengambil kendali atas klien yang sudah ada segera
  self.clients.claim();
});

// Fetch event - menyajikan konten dari cache atau mengambil dari jaringan
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Kecualikan URL pihak ketiga dan aset pengembangan dari strategi caching Service Worker
  if (
    requestUrl.origin !== location.origin || // Jika bukan dari origin yang sama
    requestUrl.protocol === "chrome-extension:" || // Ekstensi Chrome
    requestUrl.href.includes("story-app.dicoding.dev") || // API Anda
    requestUrl.href.includes("openstreetmap.org") || // OpenStreetMap CDN
    requestUrl.href.includes("unpkg.com") || // Unpkg CDN
    requestUrl.href.includes("cdnjs.cloudflare.com") || // Cloudflare CDN
    requestUrl.href.includes("sockjs-node") || // Webpack dev server websocket
    requestUrl.href.includes("hot-update.js") // Webpack HMR
  ) {
    // Untuk sumber daya eksternal atau aset pengembangan, langsung ambil dari jaringan
    event.respondWith(fetch(event.request));
    return;
  }

  // Strategi untuk file HTML dan JavaScript penting (Network-First, lalu Cache)
  // Ini memastikan kita selalu mencoba mendapatkan versi terbaru dari server pengembangan
  if (
    event.request.mode === "navigate" || // Untuk navigasi HTML (misalnya, saat memuat halaman)
    requestUrl.pathname === "/" || // Home page
    requestUrl.pathname === "/index.html" || // index.html
    requestUrl.pathname === "/src/scripts/index.js" || // index.js Anda
    requestUrl.pathname === "/src/scripts/app.js" // app.js Anda
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Jika pengambilan jaringan berhasil, cache dan kembalikan responsnya
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika pengambilan jaringan gagal (misalnya, offline), coba dapatkan dari cache
          console.log(
            "[Service Worker] Jaringan gagal, mencoba dari cache untuk:",
            event.request.url
          );
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Jika tidak ada di cache dan offline, sediakan fallback sederhana
            return new Response("<h1>Anda sedang offline.</h1>", {
              headers: { "Content-Type": "text/html" },
            });
          });
        })
    );
    return; // Penting: mencegah pemrosesan lebih lanjut untuk permintaan ini
  }

  // Strategi untuk aset lainnya (Cache-First, lalu Jaringan)
  // Ini lebih efisien untuk aset statis yang tidak sering berubah
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          console.log(
            "[Service Worker] Cache-First: Menyajikan dari Cache:",
            event.request.url
          );
          // Opsi: Revalidasi di latar belakang (Stale-While-Revalidate)
          // Ini mengambil versi terbaru dari jaringan tetapi menyajikan yang dari cache terlebih dahulu
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          });
          return response;
        }
        // Jika tidak di cache, ambil dari jaringan dan cache
        console.log(
          "[Service Worker] Cache-First: Mengambil dari Jaringan dan meng-cache:",
          event.request.url
        );
        return fetch(event.request).then((networkResponse) => {
          if (
            networkResponse.ok &&
            networkResponse.type === "basic" &&
            event.request.method === "GET" &&
            !event.request.url.startsWith("data:")
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
      .catch((error) => {
        console.error(
          "[Service Worker] Error di fetch handler:",
          event.request.url,
          error
        );
        // Fallback untuk kesalahan umum (misalnya, jaringan benar-benar mati)
        return new Response("<h1>Terjadi Kesalahan.</h1>", {
          headers: { "Content-Type": "text/html" },
          status: 500,
        });
      })
  );
});

// Push event handler
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);
  let notificationData = {
    title: "New Notification",
    body: "You have a new message!",
    icon: "/icons/icon-192x192.png", // Default icon
    badge: "/icons/icon-32x32.png", // Default badge
    tag: "default-notification",
    data: {
      url: "/", // Default URL to open
    },
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (error) {
      console.error("Error parsing push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: [
        {
          action: "open",
          title: "Open App",
          icon: "/icons/icon-32x32.png",
        },
        {
          action: "close",
          title: "Close",
        },
      ],
      requireInteraction: false,
      silent: false,
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("Notifikasi diklik:", event);
  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Coba untuk fokus pada klien yang sudah ada
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Jika tidak ada klien yang cocok, buka jendela baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
