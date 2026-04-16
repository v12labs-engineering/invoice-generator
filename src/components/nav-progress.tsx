"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top-of-page progress bar that animates during route navigations.
 *
 * Starts when:
 *  - the user clicks any same-origin <a> (or a <Link>-rendered anchor)
 *  - a `nav:start` custom event fires (for imperative router.push callers)
 * Completes when pathname or search params change.
 */
export function NavProgress() {
  return (
    <Suspense fallback={null}>
      <NavProgressInner />
    </Suspense>
  );
}

function NavProgressInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  // Clear helper
  function clearTimers() {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }

  function start() {
    clearTimers();
    setActive(true);
    setProgress(8);
    // Creep forward asymptotically so it feels alive during slow navs.
    intervalRef.current = window.setInterval(() => {
      setProgress((p) => {
        const target = 90;
        if (p >= target) return p;
        const step = Math.max(0.5, (target - p) * 0.08);
        return Math.min(target, p + step);
      });
    }, 120);
  }

  function finish() {
    clearTimers();
    setProgress(100);
    // Let the fill animation complete, then fade out.
    hideTimeoutRef.current = window.setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 250);
  }

  // Intercept same-origin link clicks to start the bar immediately.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = (e.target as HTMLElement | null)?.closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href) return;
      // Skip external, hash-only, downloads, target=_blank, and mailto/tel.
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;
      if (/^(mailto:|tel:|javascript:)/i.test(href)) return;
      if (href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (
          url.pathname === window.location.pathname &&
          url.search === window.location.search
        ) {
          return; // same page
        }
      } catch {
        return;
      }
      start();
    }
    function onStart() {
      start();
    }
    document.addEventListener("click", onClick, { capture: true });
    window.addEventListener("nav:start", onStart);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("nav:start", onStart);
      clearTimers();
    };
  }, []);

  // Finish whenever the URL settles.
  useEffect(() => {
    if (active) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  if (!active && progress === 0) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden"
    >
      <div
        className="h-full transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: active ? 1 : 0,
          background:
            "linear-gradient(90deg, #2563eb 0%, #7c3aed 50%, #2563eb 100%)",
          backgroundSize: "200% 100%",
          animation: active ? "nav-progress-shimmer 1.2s linear infinite" : "none",
          boxShadow: "0 0 8px rgba(37,99,235,0.5)",
        }}
      />
      <style>{`
        @keyframes nav-progress-shimmer {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
