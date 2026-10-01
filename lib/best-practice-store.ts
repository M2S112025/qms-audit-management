"use client";

import { useEffect, useState } from "react";
import {
  bestPracticeSeed,
  type BestPractice,
} from "@/data/best-practices";

const KEY = "qms-best-practices-v1";
const EVENT = "qms-best-practices-change";

function read(): BestPractice[] {
  if (typeof window === "undefined") return bestPracticeSeed;
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return (stored ?? bestPracticeSeed).map((item: BestPractice) => ({
      ...item,
      evidence: item.evidence ?? [],
    }));
  } catch {
    return bestPracticeSeed;
  }
}

function write(items: BestPractice[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

export function useBestPractices() {
  const [items, setItems] = useState<BestPractice[]>(bestPracticeSeed);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return items;
}

export function saveBestPractice(item: BestPractice) {
  write([item, ...read().filter((practice) => practice.id !== item.id)]);
}

export function nextBestPracticeId(items = read()) {
  const next =
    Math.max(
      ...items
        .map((item) => Number(item.id.split("-").pop()))
        .filter(Number.isFinite),
      0,
    ) + 1;
  return `BP-${new Date().getFullYear()}-${String(next).padStart(3, "0")}`;
}
