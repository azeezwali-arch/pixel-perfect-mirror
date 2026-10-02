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

export const Route = createFileRoute("/frukost")({
  head: () => ({
    meta: [
      { title: "Boka frukost – Hildur 4.0" },
      { name: "description", content: "Välj dag, tid och matsal för din frukost." },
      { property: "og:title", content: "Boka frukost – Hildur 4.0" },
      { property: "og:description", content: "Välj dag, tid och matsal för din frukost." },
    ],
  }),
  component: Frukost,
});

const TIMES = ["07:00–08:00", "08:00–09:00", "09:00–10:00", "10:00–11:00"];
const ROOMS = ["Matsal 1", "Matsal 2"] as const;
const CAP = 30;

export function DayPicker({ days, value, onChange }: { days: Date[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2" role="radiogroup" aria-label="Välj dag">
      {days.map((d) => {
        const iso = toISO(d);
        const sel = iso === value;
        return (
          <button key={iso} role="radio" aria-checked={sel} onClick={() => onChange(iso)}
            className={`tap flex min-w-[72px] flex-col items-center rounded-2xl border px-3 py-2 transition ${sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40"}`}>
            <span className="text-xs capitalize">{d.toLocaleDateString("sv-SE", { weekday: "short" })}</span>
            <span className="font-display text-xl">{d.getDate()}</span>
            <span className="text-xs">{d.toLocaleDateString("sv-SE", { month: "short" })}</span>
          </button>
        );
      })}
    </div>
  );
}

function Frukost() {
  const name = useGuestName();
  const days = useMemo(() => nextDays(7), []);
  const [date, setDate] = useState(toISO(days[0]));
  const [slot, setSlot] = useState<{ time: string; room: (typeof ROOMS)[number] } | null>(null);
  const [persons, setPersons] = useState(1);
  const [done, setDone] = useState<{ code: string; lines: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const avail = useServerFn(getAvailability);
  const book = useServerFn(createBooking);
  const qk = ["avail", "frukost", toISO(days[0])];
  const { data: counts = {} } = useQuery({
    queryKey: qk,
    queryFn: () => avail({ data: { type: "frukost", from: toISO(days[0]), to: toISO(days[6]) } }),
    refetchInterval: 10000,
  });
  const booked = (t: string, r: string) => counts[`${date}|${t}|${r}`] ?? 0;
  const left = slot ? CAP - booked(slot.time, slot.room) : 0;

  const confirm = async () => {
    if (!slot || !name) return;
    if (persons > left) return void toast.error("Det finns inte plats för så många.");
    setBusy(true);
    const res = await book({ data: { type: "frukost", date, time: slot.time, room: slot.room, persons, guestName: name } });
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ["avail"] });
    if (!res.ok) return void toast.error(res.error);
    setDone({ code: res.code, lines: [formatDay(date), `${slot.time}, ${slot.room}`, `${persons} ${persons === 1 ? "person" : "personer"}`] });
  };

  if (done) return <PageShell title="Frukost bokad"><BookingDone {...done} /></PageShell>;

  return (
    <PageShell title="Boka frukost">
      <HildurSays>{name ? `Hej ${name}, när vill du äta frukost?` : "Hej! Ange gärna ditt namn på startsidan först, så kan jag boka åt dig."}</HildurSays>
      <DayPicker days={days} value={date} onChange={(d) => { setDate(d); setSlot(null); }} />
      <div className="space-y-3">
        {TIMES.map((t) => (
          <div key={t} className="glass rounded-2xl p-4">
            <h2 className="mb-3 font-sans text-base font-semibold">{t}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROOMS.map((r) => {
                const b = booked(t, r);
                const full = level(b, CAP) === "full";
                const sel = slot?.time === t && slot.room === r;
                return (
                  <button key={r} disabled={full} onClick={() => { setSlot({ time: t, room: r }); setPersons(1); }}
                    aria-pressed={sel} aria-label={`${t}, ${r}, ${CAP - b} platser kvar`}
                    className={`tap rounded-xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${sel ? "border-primary bg-accent ring-2 ring-primary" : "border-border bg-card hover:border-primary/40"}`}>
                    <div className="mb-2 text-sm font-medium">{r}</div>
                    <SlotBar booked={b} cap={CAP} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {slot && (
        <div className="glass sticky bottom-3 mt-6 animate-fade-up rounded-2xl p-5">
          <h2 className="font-sans text-base font-semibold">Sammanfattning</h2>
          <p className="mt-1 text-sm text-muted-foreground capitalize">{formatDay(date)} · {slot.time} · {slot.room}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label htmlFor="persons" className="text-sm">Antal personer</label>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="tap rounded-full" aria-label="Färre" onClick={() => setPersons((p) => Math.max(1, p - 1))}>−</Button>
              <input id="persons" type="number" min={1} max={left} value={persons} onChange={(e) => setPersons(Math.max(1, Math.min(left, Number(e.target.value) || 1)))} className="tap w-16 rounded-lg border border-input bg-card text-center" />
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
