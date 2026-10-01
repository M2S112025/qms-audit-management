"use client";

import { useEffect } from "react";

const overlaySelector = [
  ".qms-drawer",
  ".audit-quick-view",
  ".program-context-drawer",
  ".audit-context-drawer",
  ".finding-context-open",
  ".action-context",
  ".builder-modal",
  ".builder-preview-overlay",
  ".execution-nav-pane.mobile-pane-open",
  ".execution-context-pane.mobile-pane-open",
  ".builder-structure-pane.builder-pane-open",
  ".builder-config-pane.builder-pane-open",
].join(",");

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function isVisible(element: HTMLElement) {
  const style = window.getComputedStyle(element);
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    element.getClientRects().length > 0
  );
}

function topOverlay() {
  return Array.from(document.querySelectorAll<HTMLElement>(overlaySelector))
    .filter(isVisible)
    .at(-1);
}

function focusableElements(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(isVisible);
}

export function useOverlayFocus() {
  useEffect(() => {
    const initialized = new WeakSet<HTMLElement>();

    const prepareOverlay = () => {
      const overlay = topOverlay();
      if (!overlay || initialized.has(overlay)) return;
      initialized.add(overlay);
      if (!overlay.hasAttribute("role")) overlay.setAttribute("role", "dialog");
      if (!overlay.hasAttribute("aria-modal"))
        overlay.setAttribute("aria-modal", "true");
      requestAnimationFrame(() => focusableElements(overlay)[0]?.focus());
    };

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const overlay = topOverlay();
      if (!overlay) return;
      const focusable = focusableElements(overlay);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      const active = document.activeElement;
      if (!overlay.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    const observer = new MutationObserver(prepareOverlay);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("keydown", trapFocus);
    prepareOverlay();
    return () => {
      observer.disconnect();
      document.removeEventListener("keydown", trapFocus);
    };
  }, []);
}
