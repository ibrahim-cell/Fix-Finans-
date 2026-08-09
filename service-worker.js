// Fix Finans - Service Worker
// Offline cache + basit güncelleme mekanizması

const CACHE_SURUMU = "fixfinans-v13";

const CACHE_DOSYALARI = [
  "./",
  "./index.html",
  "./manifest.json",
  "./chart.min.js",
  "./icon-152.png",
  "./icon-192.png",
  "./icon-512.png",
  "./fix-finans-app-icon.png",
  "./fix-finans-header-brand.png",
  "./fix-finans-header-logo.png",
  "./fix-finans-header-icon.png",
  "./fix-finans-header-icon.png?v=12",
  "./fix-finans-logo-full.png"
];

// Kurulum: temel dosyaları önbelleğe al
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_SURUMU).then(function (cache) {
      return cache.addAll(CACHE_DOSYALARI);
    })
  );
  self.skipWaiting();
});

// Aktifleşme: eski sürüm önbelleklerini temizle (güncelleme mekanizması)
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (isimler) {
      return Promise.all(
        isimler
          .filter(function (isim) {
            return isim !== CACHE_SURUMU;
          })
          .map(function (isim) {
            return caches.delete(isim);
          })
      );
    })
  );
  self.clients.claim();
});

// İstekler: önce önbellek, yoksa ağdan al ve önbelleğe ekle,
// ağ da yoksa (offline) elde ne varsa onunla devam et
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function (onbellekYaniti) {
      if (onbellekYaniti) {
        // Arka planda güncel sürümü de çekmeyi dene (stale-while-revalidate)
        fetch(event.request)
          .then(function (agYaniti) {
            if (agYaniti && agYaniti.ok) {
              caches.open(CACHE_SURUMU).then(function (cache) {
                cache.put(event.request, agYaniti);
              });
            }
          })
          .catch(function () {
            /* offline: sorun değil, önbellekten devam */
          });
        return onbellekYaniti;
      }

      return fetch(event.request)
        .then(function (agYaniti) {
          if (agYaniti && agYaniti.ok) {
            const kopya = agYaniti.clone();
            caches.open(CACHE_SURUMU).then(function (cache) {
              cache.put(event.request, kopya);
            });
          }
          return agYaniti;
        })
        .catch(function () {
          // Hem önbellek hem ağ yoksa ve ana sayfa isteniyorsa app shell'i döndür
          if (event.request.mode === "navigate") {
    return caches.match("./index.html");
            
          }
        });
    })
  );
});
