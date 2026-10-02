import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { reportFault } from "@/lib/hotel.functions";
import { useGuestName } from "@/lib/guest";
import { HildurSays, PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/fel")({
  head: () => ({
    meta: [
      { title: "Anmäl fel – Hildur 4.0" },
      { name: "description", content: "Anmäl ett fel i ditt rum eller på hotellet." },
      { property: "og:title", content: "Anmäl fel – Hildur 4.0" },
      { property: "og:description", content: "Anmäl ett fel i ditt rum eller på hotellet." },
    ],
  }),
  component: Fel,
});

const CATS = ["El & belysning", "VVS & vatten", "Värme & ventilation", "Wifi & TV", "Städning", "Övrigt"];
const field = "tap w-full rounded-xl border border-input bg-card px-4 py-2";

function toB64(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

function Fel() {
  const name = useGuestName();
  const send = useServerFn(reportFault);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const file = fd.get("image") as File | null;
    let image: { base64: string; type: "image/jpeg" | "image/png" | "image/webp" } | null = null;
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) return toast.error("Bilden får vara max 5 MB.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return toast.error("Använd JPG, PNG eller WebP.");
      image = { base64: await toB64(file), type: file.type as "image/jpeg" };
    }
    setBusy(true);
    try {
      const r = await send({ data: {
        guestName: name || String(fd.get("name") || "Gäst"),
        location: String(fd.get("location")), category: String(fd.get("category")),
        description: String(fd.get("description")), image,
      } });
      if (!r.ok) throw new Error();
      setDone(true);
    } catch { toast.error("Felanmälan kunde inte skickas."); }
    finally { setBusy(false); }
  };

  if (done)
    return (
      <PageShell title="Anmäl fel">
        <HildurSays>Tack {name || "för din anmälan"}, felet är anmält. Vi tittar på det så snart som möjligt.</HildurSays>
        <Link to="/" className="tap inline-flex items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">Till startsidan</Link>
      </PageShell>
    );

  return (
    <PageShell title="Anmäl fel">
      <HildurSays>Berätta vad som har hänt{name ? `, ${name}` : ""}, så ser vi till att det åtgärdas.</HildurSays>
      <form onSubmit={submit} className="glass space-y-4 rounded-2xl p-5">
        {!name && (
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">Ditt namn</label>
            <input id="name" name="name" required className={field} />
          </div>
        )}
        <div>
          <label htmlFor="location" className="mb-1 block text-sm font-medium">Plats / rum</label>
          <input id="location" name="location" required placeholder="T.ex. rum 214" className={field} />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">Kategori</label>
          <select id="category" name="category" required className={field}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">Beskrivning</label>
          <textarea id="description" name="description" required minLength={3} rows={4} className={field} />
        </div>
        <div>
          <label htmlFor="image" className="mb-1 block text-sm font-medium">Bild (valfri)</label>
          <input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" className="text-sm file:mr-3 file:min-h-[44px] file:rounded-full file:border-0 file:bg-secondary file:px-4 file:text-secondary-foreground" />
        </div>
        <Button type="submit" disabled={busy} className="tap w-full rounded-full">{busy ? "Skickar…" : "Skicka felanmälan"}</Button>
      </form>
    </PageShell>
  );
}
