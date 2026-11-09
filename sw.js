/* ==========================================================================
   sw.js — service worker (deixa o site/painel instalável como app)
   Estratégia: SEMPRE tenta a rede primeiro (você nunca vê versão velha do
   código). Só usa a cópia guardada se estiver sem internet.
   Dados do Supabase e bibliotecas externas NUNCA são guardados aqui.
   ========================================================================== */
const VERSAO = 'v1';
const CACHE = 'app-shell-' + VERSAO;
const BASICO = ['./', 'index.html', 'admin.html', 'css.css', 'admin.css', 'js.js', 'admin.js', 'i18n.js', 'fundos.css', 'fundos.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(BASICO.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // Supabase, CDNs: deixa passar direto
  if (url.pathname.endsWith('/sw.js')) return;

  e.respondWith(
    fetch(req)
      .then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match(req.mode === 'navigate' ? 'index.html' : req)))
  );
});
