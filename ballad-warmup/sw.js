/* 예전 주소(/ballad-warmup/)로 설치한 앱을 새 주소로 옮기는 서비스 워커입니다.
   저장된 캐시를 지우고, 스스로 등록을 해제한 뒤 새 주소로 이동합니다. */
const NEW_URL = 'https://hey7995.github.io/tools/ballad-warmup/';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const list = await self.clients.matchAll({ type: 'window' });
    list.forEach(c => { try { c.navigate(NEW_URL); } catch (err) {} });
  })());
});
