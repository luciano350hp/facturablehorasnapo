import { useEffect, useState } from "react";

export type Client = {
  id: string;
  name: string;
  type: "hour" | "word";
  rate: number; // ARS por hora o por palabra
  pricingMode?: "auto" | "manual"; // para word
  repetitionDiscount?: number; // % default 50
};

export type TimeEntry = {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  kind: "billable" | "planning";
  note?: string;
};

export type WordJob = {
  id: string;
  clientId: string;
  date: string;
  title: string;
  totalWords: number;
  repeatedWords: number;
  pricedAmount: number;
};

export type Store = {
  profileName: string;
  currency: string;
  clients: Client[];
  entries: TimeEntry[];
  jobs: WordJob[];
};

const KEY = "horasclaras_v1";

const seed: Store = {
  profileName: "Caro Méndez",
  currency: "ARS",
  clients: [
    { id: "c1", name: "Instituto Greenway", type: "hour", rate: 8500 },
    { id: "c2", name: "Lucas Pereyra", type: "hour", rate: 7000 },
    { id: "c3", name: "Estudio Jurídico Vidal", type: "word", rate: 22, pricingMode: "auto", repetitionDiscount: 50 },
    { id: "c4", name: "Editorial Norte", type: "word", rate: 18, pricingMode: "manual", repetitionDiscount: 50 },
  ],
  entries: [
    { id: "e1", clientId: "c1", date: today(-2), minutes: 90, kind: "billable", note: "Clase grupal B1" },
    { id: "e2", clientId: "c1", date: today(-1), minutes: 60, kind: "billable" },
    { id: "e3", clientId: "c1", date: today(-1), minutes: 30, kind: "planning", note: "Armado material" },
    { id: "e4", clientId: "c2", date: today(0), minutes: 60, kind: "billable", note: "Conversación" },
    { id: "e5", clientId: "c3", date: today(-3), minutes: 45, kind: "planning", note: "Revisión glosario" },
  ],
  jobs: [
    { id: "j1", clientId: "c3", date: today(-3), title: "Contrato comercial", totalWords: 2840, repeatedWords: 320, pricedAmount: 51920 },
  ],
};

function today(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function load(): Store {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Store;
  } catch {
    return seed;
  }
}

let memory: Store | null = null;
const listeners = new Set<() => void>();

function getStore(): Store {
  if (!memory) memory = load();
  return memory;
}

function setStore(next: Store) {
  memory = next;
  if (typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

export function useStore() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    store: getStore(),
    update: (fn: (s: Store) => Store) => setStore(fn(getStore())),
    reset: () => setStore(seed),
  };
}

export function formatMoney(n: number, currency = "ARS") {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

export function minutesToHuman(m: number) {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h === 0) return `${mm}min`;
  if (mm === 0) return `${h}h`;
  return `${h}h ${mm}m`;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function countWords(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const total = words.length;
  const seen = new Map<string, number>();
  for (const w of words) {
    const k = w.toLowerCase().replace(/[.,;:!?()"'¿¡]/g, "");
    if (!k) continue;
    seen.set(k, (seen.get(k) ?? 0) + 1);
  }
  let repeated = 0;
  seen.forEach((count) => {
    if (count > 1) repeated += count - 1;
  });
  return { total, repeated, unique: seen.size };
}
