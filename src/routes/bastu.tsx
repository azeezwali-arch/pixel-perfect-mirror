import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createBooking, getAvailability } from "@/lib/hotel.functions";
import { formatDay, level, nextDays, toISO, useGuestName } from "@/lib/guest";
import { HildurSays, PageShell } from "@/components/SiteChrome";
import { SlotBar } from "@/components/SlotBar";
import { BookingDone } from "@/components/BookingDone";
import { Button } from "@/components/ui/button";
import { DayPicker } from "./frukost";

export const Route = createFileRoute("/bastu")({
  head: () => ({
    meta: [
      { title: "Boka bastu – Hildur 4.0" },
      { name: "description", content: "Boka ett 15-minuterspass i bastun mellan 07:00 och 16:00." },
      { property: "og:title", content: "Boka bastu – Hildur 4.0" },
      { property: "og:description", content: "Boka ett 15-minuterspass i bastun mellan 07:00 och 16:00." },
    ],
  }),
  component: Bastu,
});

const CAP = 8;
const SLOTS: string[] = [];
for (let m = 7 * 60; m < 16 * 60; m += 15) {
  const f = (x: number) => `${String(Math.floor(x / 60)).padStart(2, "0")}:${String(x % 60).padStart(2, "0")}`;
  SLOTS.push(`${f(m)}–${f(m + 15)}`);
}

function Bastu() {
  const name = useGuestName();
  const days = useMemo(() => nextDays(7), []);
  const [date, setDate] = useState(toISO(days[0]));
  const [slot, setSlot] = useState<string | null>(null);
  const [persons, setPersons] = useState(1);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ code: string; lines: string[] } | null>(null);
  const qc = useQueryClient();
  const avail = useServerFn(getAvailability);
  const book = useServerFn(createBooking);
  const { data: counts = {} } = useQuery({
    queryKey: ["avail", "bastu", toISO(days[0])],
    queryFn: () => avail({ data: { type: "bastu", from: toISO(days[0]), to: toISO(days[6]) } }),
    refetchInterval: 10000,
  });
  const booked = (t: string) => counts[`${date}|${t}|`] ?? 0;
  const left = slot ? CAP - booked(slot) : 0;

  const confirm = async () => {
    if (!slot || !name) return;
    if (persons > left) return void toast.error("Det finns inte plats för så många.");
    setBusy(true);
    const res = await book({ data: { type: "bastu", date, time: slot, room: null, persons, guestName: name } });
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ["avail"] });
    if (!res.ok) return void toast.error(res.error);
    setDone({ code: res.code, lines: [formatDay(date), `Bastu ${slot}`, `${persons} ${persons === 1 ? "person" : "personer"}`] });
  };

  if (done) return <PageShell title="Bastu bokad"><BookingDone {...done} /></PageShell>;

  return (
    <PageShell title="Boka bastu">
      <HildurSays>{name ? `Hej ${name}, när vill du basta? Varje pass är 15 minuter.` : "Hej! Ange gärna ditt namn på startsidan först."}</HildurSays>
      <DayPicker days={days} value={date} onChange={(d) => { setDate(d); setSlot(null); }} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {SLOTS.map((t) => {
          const b = booked(t);
          const full = level(b, CAP) === "full";
          const sel = slot === t;
          return (
            <button key={t} disabled={full} onClick={() => { setSlot(t); setPersons(1); }} aria-pressed={sel}
              aria-label={`${t}, ${CAP - b} platser kvar`}
              className={`tap rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${sel ? "border-primary bg-accent ring-2 ring-primary" : "border-border bg-card hover:border-primary/40"}`}>
              <div className="mb-2 text-sm font-semibold">{t}</div>
              <SlotBar booked={b} cap={CAP} />
            </button>
          );
        })}
      </div>

      {slot && (
        <div className="glass sticky bottom-3 mt-6 animate-fade-up rounded-2xl p-5">
          <h2 className="font-sans text-base font-semibold">Sammanfattning</h2>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{formatDay(date)} · {slot}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm">Antal personer</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="tap rounded-full" aria-label="Färre" onClick={() => setPersons((p) => Math.max(1, p - 1))}>−</Button>
              <span className="w-8 text-center font-semibold" aria-live="polite">{persons}</span>
              <Button variant="outline" className="tap rounded-full" aria-label="Fler" onClick={() => setPersons((p) => Math.min(left, p + 1))}>+</Button>
            </div>
            <span className="text-xs text-muted-foreground">max {left}</span>
          </div>
          <Button className="tap mt-4 w-full rounded-full" disabled={busy || !name || persons > left} onClick={confirm}>
            {busy ? "Bokar…" : "Bekräfta bokning"}
          </Button>
        </div>
      )}
    </PageShell>
  );
}
