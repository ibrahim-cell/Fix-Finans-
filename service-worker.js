// Fix Finans V4.32 — temiz Service Worker
const CACHE_SURUMU = "fixfinans-v4.32";

const CACHE_DOSYALARI = [
  "./",
  "./index.html",
  "./manifest.json",
  "./vendor/chart.min.js",
  "./icon-152.png",
  "./icon-192.png",
  "./icon-512.png",
  "./fix-finans-app-icon.png",
  "./fix-finans-header-brand.png",
  "./fix-finans-header-logo.png",
  "./fix-finans-header-icon.png",
  "./fix-finans-logo-full.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_SURUMU).then(function(cache){
      return cache.addAll(CACHE_DOSYALARI);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(name){ return name !== CACHE_SURUMU; })
             .map(function(name){ return caches.delete(name); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;

      return fetch(event.request).then(function(response){
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_SURUMU).then(function(cache){
            cache.put(event.request,copy);
          });
        }
        return response;
      }).catch(function(){
        if(event.request.mode === "navigate") return caches.match("./index.html");
        return undefined;
      });
    })
  );
});
