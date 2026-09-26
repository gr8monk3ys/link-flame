"use client";

import { useEffect } from "react";

// Registration and the hourly update check are app-wide, once per page load:
// a module-level guard keeps a remount (or StrictMode's double effect) from
// registering again and stacking another interval (react-best-practices 8.2).
let didRegister = false;

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (didRegister) return;
    didRegister = true;
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[SW] Service Worker registered:", registration.scope);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Check every hour
        })
        .catch((error) => {
          console.error("[SW] Service Worker registration failed:", error);
        });
    }
  }, []);

  return null;
}
