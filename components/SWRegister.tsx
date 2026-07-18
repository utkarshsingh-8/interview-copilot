"use client";

import { useEffect } from "react";

// Registers the service worker for offline PWA support. No-op in dev if
// unsupported. Kept tiny so it can sit in the root layout.
export default function SWRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
