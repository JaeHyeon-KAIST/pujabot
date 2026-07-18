"use client";

import { useEffect } from "react";

/**
 * Disables pinch-to-zoom (and trackpad ctrl+wheel zoom) inside the installed
 * PWA only — browser tabs keep native zoom for accessibility. iOS ignores the
 * viewport user-scalable flag, so the Safari gesture events are the reliable
 * fix there; Chromium is covered by `touch-action` in globals.css.
 */
export default function NoPinchZoom() {
  useEffect(() => {
    const nav = window.navigator as Navigator & { standalone?: boolean };
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      nav.standalone === true;
    if (!standalone) return;

    const stop = (e: Event) => e.preventDefault();
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const opts: AddEventListenerOptions = { passive: false };

    document.addEventListener("gesturestart", stop, opts);
    document.addEventListener("gesturechange", stop, opts);
    document.addEventListener("gestureend", stop, opts);
    document.addEventListener("wheel", onWheel, opts);
    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("gestureend", stop);
      document.removeEventListener("wheel", onWheel);
    };
  }, []);

  return null;
}
