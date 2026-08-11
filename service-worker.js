// Fix Finans V5.0.9 — Stabil Service Worker
const CACHE_SURUMU = "fixfinans-v5-1-1";

const CACHE_DOSYALARI = [
  "./",
  "./index.html",
  "./manifest.json",
  "./vendor/chart.min.js",
  "./icon-152.png",
  "./icon-192.png",
  "./icon-512.png",
  "./fix-finans-header-icon.png",
  "./fix-finans-splash-icon.png"
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

  const url = new URL(event.request.url);

  // Canlı kur/API çağrıları için Network First: bayat cache kullanılmaz.
  const isLiveApi =
    url.hostname === "api.frankfurter.app" ||
    url.hostname === "open.er-api.com";

  if(isLiveApi){
    event.respondWith(
      fetch(event.request, {cache:"no-store"}).catch(function(){
        return new Response(JSON.stringify({
          result:"error",
          offline:true,
          message:"Canlı kur servisine ulaşılamadı."
        }), {
          status: 503,
          headers: {"Content-Type":"application/json"}
        });
      })
    );
    return;
  }

  // V5.1.0: navigation/HTML uses Network First; splash is embedded in HTML to avoid stale/missing image paths.
  const isNavigation = event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") || url.pathname === "/";

  if(isNavigation){
    event.respondWith(
      fetch(event.request, {cache:"no-store"}).then(function(response){
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_SURUMU).then(function(cache){
            cache.put("./index.html", copy);
          });
        }
        return response;
      }).catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || caches.match("./index.html");
        });
      })
    );
    return;
  }

  if (url.pathname.endsWith("/fix-finans-splash-icon.png")) {
    event.respondWith(fetch(event.request, {cache:"no-store"}));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cached){
      if(cached) return cached;

      return fetch(event.request).then(function(response){
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE_SURUMU).then(function(cache){
            cache.put(event.request, copy);
          });
        }
        return response;
      });
    }).catch(function(){
      return undefined;
    })
  );
});
