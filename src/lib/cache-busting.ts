// Cache-busting para rutas nuevas y chunks obsoletos.
//
// Escenarios cubiertos:
//  1. El usuario navega a una ruta agregada en un deploy nuevo, pero el navegador
//     tiene en caché un bundle viejo → Vite falla al precargar el chunk y disparamos
//     una recarga forzada (hard reload) con parámetro anti-caché.
//  2. Un chunk hash-eado ya no existe en el servidor (el build cambió) → capturamos
//     `ChunkLoadError` / errores de <script>/import() y recargamos.
//  3. Cada cambio de ruta pide al service worker `update()` para bajar cuanto antes
//     el nuevo SW/bundle si hubiera uno publicado.

const RELOAD_FLAG = "__cb_reloaded_at";
const MIN_INTERVAL_MS = 15_000;

function shouldReload(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return false;
    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
    return true;
  } catch {
    return true;
  }
}

function hardReload() {
  if (!shouldReload()) return;
  try {
    // Limpiar caches del navegador que podrían servir bundles viejos.
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) =>
        regs.forEach((r) => r.update().catch(() => {}))
      );
    }
  } catch {}
  const url = new URL(window.location.href);
  url.searchParams.set("_v", String(Date.now()));
  window.location.replace(url.toString());
}

function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    (err as any)?.message ||
    (typeof err === "string" ? err : "") ||
    String(err);
  return (
    /ChunkLoadError/i.test(msg) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

export function setupCacheBusting() {
  if (typeof window === "undefined") return;

  // Vite emite este evento cuando un import dinámico falla al precargarse.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault?.();
    hardReload();
  });

  // Fallback general para ChunkLoadError y errores de módulos.
  window.addEventListener("error", (event) => {
    if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
      hardReload();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    if (isChunkLoadError(event.reason)) {
      hardReload();
    }
  });

  // En cada cambio de ruta client-side, pedir update al service worker.
  const askSwToUpdate = () => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.update().catch(() => {}))
    );
  };

  const wrap = <T extends "pushState" | "replaceState">(method: T) => {
    const original = history[method];
    history[method] = function (...args: any[]) {
      const result = original.apply(this, args as any);
      window.dispatchEvent(new Event("locationchange"));
      return result;
    } as any;
  };
  wrap("pushState");
  wrap("replaceState");
  window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
  window.addEventListener("locationchange", askSwToUpdate);
}
