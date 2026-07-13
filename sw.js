/* ═══════════════════════════════════════════════════════════
   wildcock service worker — 오프라인 지원 (network-first)

   전략: 요청마다 ① 네트워크 시도 → 성공하면 응답을 캐시에 복사해두고 반환
                 ② 실패(오프라인)하면 캐시에 보관된 마지막 사본 반환
   장점: 온라인일 땐 항상 최신 파일 → 업데이트가 막히지 않음
         오프라인일 땐 마지막으로 본 버전으로 정상 동작

   ✅ 버전 단일화: 이 파일은 자기 URL의 ?v= 값에서 버전을 읽습니다.
      배포 시 index.html의 버전(?v=)만 올리면 SW·캐시·프리캐시가 함께 갱신돼요.
      (index.html에서 sw.js?v=..., app.jsx?v=..., wildcock-core.js?v=... 를 같은 값으로)
   ═══════════════════════════════════════════════════════════ */
"use strict";

var SW_VERSION = (function () {
  try { return new URL(self.location.href).searchParams.get("v") || "base"; }
  catch (e) { return "base"; }
})();
var CACHE_NAME = "wildcock-" + SW_VERSION;

/* 설치 직후부터 오프라인이 가능하도록 미리 담아두는 핵심 파일(앱 셸) */
var PRECACHE = [
  "./",
  "./index.html",
  "./support.js",
  "./wildcock-core.js?v=" + SW_VERSION,
  "./app.jsx?v=" + SW_VERSION,
  "./manifest.json",
  "./uploads/favicon_32.png",
  "./uploads/favicon_192.png",
  "./uploads/favicon_512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) {
        /* 개별 실패(파일 없음 등)가 설치 전체를 막지 않도록 하나씩 시도 */
        return Promise.all(PRECACHE.map(function (url) {
          return cache.add(url).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k.indexOf("wildcock-") === 0 && k !== CACHE_NAME) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return; /* GitHub 저장(PUT) 등은 건드리지 않음 */

  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  var isCdn = url.hostname === "cdn.jsdelivr.net"; /* Pretendard 폰트 CSS */
  if (!sameOrigin && !isCdn) return; /* api.github.com 등 동적 요청은 브라우저 기본 동작 */

  e.respondWith(
    fetch(req)
      .then(function (res) {
        /* 성공 응답은 캐시에 사본 보관 (오프라인 대비) */
        if (res && (res.ok || res.type === "opaque")) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); }).catch(function () {});
        }
        return res;
      })
      .catch(function () {
        /* 오프라인: 캐시 사본 반환. ignoreSearch로 ?v= 버전이 달라도
           구버전 사본이라도 내줌 (안 열리는 것보단 나음) */
        return caches.match(req).then(function (hit) {
          if (hit) return hit;
          return caches.match(req, { ignoreSearch: true }).then(function (hit2) {
            if (hit2) return hit2;
            /* 페이지 이동 요청이면 앱 셸로 폴백 */
            if (req.mode === "navigate") return caches.match("./index.html");
            return Response.error();
          });
        });
      })
  );
});
