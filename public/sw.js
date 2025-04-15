// Service Worker para o ERIO STUDIO Gestão Financeira PWA
const CACHE_NAME = 'erio-gestao-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/fallback.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/index.css',
  '/assets/index.js',
  '/images/logos/logo-horizontal-cor-institucional.png',
  '/images/icons/log_erio.ico',
  '/images/icons/log_erio.ico.72x72.png'
];

// Instala o service worker e cria o cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Intercepta requisições e tenta retornar do cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - retorna do cache
        if (response) {
          return response;
        }

        // Clone a requisição, pois ela só pode ser usada uma vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then(response => {
            // Verifica se é uma resposta válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone a resposta para armazenar no cache
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Não armazena requisições com query string (para evitar problemas com APIs)
                if (!event.request.url.includes('?')) {
                  cache.put(event.request, responseToCache);
                }
              });

            return response;
          })
          .catch(() => {
            // Se a rede falhar, tenta retornar a página fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/fallback.html');
            }
          });
      })
  );
});

// Limpa caches antigos quando uma nova versão é ativada
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 