import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cancelBooking, listBookings } from "@/lib/hotel.functions";
import { formatDay, useGuestName } from "@/lib/guest";
import { HildurSays, PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/avboka")({
  head: () => ({
    meta: [
      { title: "Avboka – Hildur 4.0" },
      { name: "description", content: "Se och avboka dina frukost- och bastubokningar." },
      { property: "og:title", content: "Avboka – Hildur 4.0" },
      { property: "og:description", content: "Se och avboka dina frukost- och bastubokningar." },
    ],
  }),
  component: Avboka,
});

type B = Awaited<ReturnType<typeof listBookings>>[number];

function Avboka() {
  const stored = useGuestName();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [items, setItems] = useState<B[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const list = useServerFn(listBookings);
  const cancel = useServerFn(cancelBooking);
  const qc = useQueryClient();
  useEffect(() => { if (stored && !name) setName(stored); }, [stored, name]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    try {
      setItems(await list({ data: { guestName: name.trim(), code: code.trim() || undefined } }));
    } catch { toast.error("Kunde inte hämta bokningar."); }
  };

  const doCancel = async (b: B) => {
    const r = await cancel({ data: { id: b.id, guestName: name.trim() } });
    if (!r.ok) return void toast.error("Avbokningen misslyckades.");
    setItems((x) => x?.filter((i) => i.id !== b.id) ?? null);
    await qc.invalidateQueries({ queryKey: ["avail"] });
    setMsg(`Din bokning är avbokad, ${name.trim()}.`);
  };

  return (
    <PageShell title="Avboka">
      <HildurSays>{msg ?? "Ange ditt namn (och bokningskod om du har en) så hittar jag dina bokningar."}</HildurSays>
      <form onSubmit={search} className="glass grid gap-3 rounded-2xl p-5 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label htmlFor="n" className="mb-1 block text-sm font-medium">Namn</label>
          <input id="n" required value={name} onChange={(e) => setName(e.target.value)} className="tap w-full rounded-xl border border-input bg-card px-4" />
        </div>
        <div>
          <label htmlFor="c" className="mb-1 block text-sm font-medium">Bokningskod (valfri)</label>
          <input id="c" value={code} onChange={(e) => setCode(e.target.value)} className="tap w-full rounded-xl border border-input bg-card px-4 font-mono uppercase" />
        </div>
        <Button type="submit" className="tap self-end rounded-full">Visa bokningar</Button>
      </form>

      {items && (
        <ul className="mt-6 space-y-3">
          {items.length === 0 && <li className="text-muted-foreground">Inga aktiva bokningar hittades.</li>}
          {items.map((b) => (
            <li key={b.id} className="glass flex animate-fade-up flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
              <div>
                <div className="font-semibold">{b.type === "frukost" ? "Frukost" : "Bastu"} · {b.time}{b.room ? ` · ${b.room}` : ""}</div>
                <div className="text-sm capitalize text-muted-foreground">{formatDay(b.date)} · {b.persons} pers · kod {b.code}</div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="tap rounded-full">Avboka</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Avboka denna bokning?</AlertDialogTitle>
                    <AlertDialogDescription>Platserna blir lediga igen direkt. Detta kan inte ångras.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="tap">Behåll</AlertDialogCancel>
                    <AlertDialogAction className="tap" onClick={() => doCancel(b)}>Ja, avboka</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
