"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISSED_KEY = "pwa_install_dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPromptBanner() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Already installed (standalone mode)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (isStandalone) return;

    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) && !/chrome/i.test(ua);

    if (ios) {
      setIsIos(true);
      setShow(true);
      return;
    }

    // Android / Chrome: wait for browser install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  if (!show) return null;

  return (
    <div className="flex items-start gap-3 bg-[#0C1E2E] border-b border-white/10 px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500">
        <Download className="h-4 w-4 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-white leading-snug">
          Add to Home Screen
        </p>
        {isIos ? (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Tap <Share className="inline h-3 w-3 mb-0.5" /> then &ldquo;Add to Home Screen&rdquo; for quick access
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
            Install ServiceOps for faster access to your jobs
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isIos && deferredPrompt && (
          <button
            onClick={install}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-[12px] font-semibold text-white active:opacity-80"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 active:text-white"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
