import { useEffect, useState } from "react";

const KEY = "hildur_guest_name";
const EVT = "hildur-name";

export function setGuestName(name: string) {
  sessionStorage.setItem(KEY, name);
  window.dispatchEvent(new Event(EVT));
}

export function useGuestName() {
  const [name, setName] = useState<string>("");
  useEffect(() => {
    const read = () => setName(sessionStorage.getItem(KEY) ?? "");
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);
  return name;
}

export function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function nextDays(n: number) {
  const out: Date[] = [];
  const t = new Date();
  for (let i = 0; i < n; i++) out.push(new Date(t.getFullYear(), t.getMonth(), t.getDate() + i));
  return out;
}

export function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });
}

export type Level = "ok" | "low" | "full";
export function level(booked: number, cap: number): Level {
  if (booked >= cap) return "full";
  if (booked / cap >= 0.75) return "low";
  return "ok";
}
