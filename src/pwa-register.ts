// Guarded service worker registration with auto-reload on update.
import { registerSW } from "virtual:pwa-register";

function isPreviewOrDev(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const h = window.location.hostname;
  if (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev")
  ) {
    return true;
  }
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") {
    return true;
  }
  return false;
}

export function setupPWA() {
  if (isPreviewOrDev()) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => {
          if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
        });
      });
    }
    return;
  }

  let reloaded = false;
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // skipWaiting is set in workbox config; new SW activates automatically.
      updateSW(true);
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      // Check for updates whenever app regains focus / becomes visible.
      const check = () => registration.update().catch(() => {});
      window.addEventListener("focus", check);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      // Periodic check every 60 minutes while app is open.
      setInterval(check, 60 * 60 * 1000);
    },
  });
}
