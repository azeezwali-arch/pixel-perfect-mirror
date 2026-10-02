import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { setGuestName, useGuestName } from "@/lib/guest";

// Byt ut mot er egen video (mp4). Bilden används som fallback.
const HERO_VIDEO_URL = "https://videos.pexels.com/video-files/7578552/7578552-uhd_2560_1440_30fps.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hildur 4.0 – Din digitala receptionist" },
      { name: "description", content: "Chatta med Hildur och boka frukost, bastu eller anmäl fel – dygnet runt." },
      { property: "og:title", content: "Hildur 4.0 – Din digitala receptionist" },
      { property: "og:description", content: "Chatta med Hildur och boka frukost, bastu eller anmäl fel – dygnet runt." },
    ],
  }),
  component: Home,
});

type Msg = { from: "hildur" | "guest"; text: React.ReactNode; key: number };

const CHIPS = [
  { label: "Boka frukost", intent: "frukost" },
  { label: "Boka bastu", intent: "bastu" },
  { label: "Anmäl fel", intent: "fel" },
  { label: "Om strömmen går", intent: "strom" },
  { label: "Hur skyddas min data?", intent: "data" },
  { label: "Avboka min bokning", intent: "avboka" },
] as const;
type Intent = (typeof CHIPS)[number]["intent"];

function detect(t: string): Intent | null {
  const s = t.toLowerCase();
  if (/avbok|ångra|cancel/.test(s)) return "avboka";
  if (/frukost|äta|morgonmat/.test(s)) return "frukost";
  if (/bastu|sauna/.test(s)) return "bastu";
  if (/ström|el\b|elavbrott|strömavbrott|blackout/.test(s)) return "strom";
  if (/data|integritet|gdpr|personuppgift|säker/.test(s)) return "data";
  if (/fel|trasig|sönder|fungerar inte|läck|problem/.test(s)) return "fel";
  return null;
}

function useHeroVideo() {
  const [use, setUse] = useState(false);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 640px)").matches;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData || /2g|3g/.test(conn?.effectiveType ?? "");
    setUse(!reduce && !small && !slow);
  }, []);
  return use;
}

function Home() {
  const stored = useGuestName();
  const navigate = useNavigate();
  const showVideo = useHeroVideo();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [name, setName] = useState("");
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const k = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const say = (text: React.ReactNode, delay = 700) =>
    new Promise<void>((res) => {
      setTyping(true);
      setTimeout(() => {
        setTyping(false);
        setMsgs((m) => [...m, { from: "hildur", text, key: k.current++ }]);
        res();
      }, delay);
    });

  useEffect(() => {
    if (started) return;
    setStarted(true);
    const existing = sessionStorage.getItem("hildur_guest_name");
    if (existing) {
      setName(existing);
      void say(`Välkommen tillbaka, ${existing}! Vad kan jag hjälpa dig med?`, 500);
    } else {
      void say("Hej och välkommen! Jag är Hildur, din AI-receptionist. Vad heter du?", 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs, typing]);

  const guest = (text: string) => setMsgs((m) => [...m, { from: "guest", text, key: k.current++ }]);

  const handleIntent = async (intent: Intent, n: string) => {
    switch (intent) {
      case "frukost":
        await say("Självklart! Jag tar dig till frukostbokningen.", 500);
        return navigate({ to: "/frukost" });
      case "bastu":
        await say("Härligt! Jag öppnar bastubokningen.", 500);
        return navigate({ to: "/bastu" });
      case "fel":
        await say("Tråkigt att höra. Jag öppnar felanmälan.", 500);
        return navigate({ to: "/fel" });
      case "avboka":
        await say("Inga problem, vi hittar din bokning.", 500);
        return navigate({ to: "/avboka" });
      case "strom":
        return say(
          <>
            Ingen fara, {n}! Jag körs i molnet och har alltid en backup, så jag är online oavsett om strömmen går här på plats. Dina bokningar är säkra och du kan fortsätta använda mig från din mobil. Är det akut hjälper receptionen dig på plats.{" "}
            <Link to="/driftsakerhet" className="font-medium underline underline-offset-2">Läs mer om driftsäkerhet</Link>
          </>,
        );
      case "data":
        return say(
          <>
            Din data krypteras under överföring och lagring, delas inte med tredje part och lagras i molnet med regelbunden backup. Du kan läsa mer under{" "}
            <Link to="/datasakerhet" className="font-medium underline underline-offset-2">Hur din data skyddas</Link>.
          </>,
        );
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = input.trim();
    if (!t || typing) return;
    setInput("");
    guest(t);
    if (!name) {
      const n = t.slice(0, 40);
      setName(n);
      setGuestName(n);
      await say(`Trevligt att träffas, ${n}! Vad kan jag hjälpa dig med?`);
    } else {
      const intent = detect(t);
      if (intent) await handleIntent(intent, name);
      else await say("Det förstod jag inte riktigt. Välj gärna ett av alternativen nedan, eller fråga om frukost, bastu, fel, ström, data eller avbokning.");
    }
    inputRef.current?.focus();
  };

  const chip = async (c: (typeof CHIPS)[number]) => {
    if (typing) return;
    guest(c.label);
    await handleIntent(c.intent, name || stored);
  };

  return (
    <>
      <section className="relative isolate flex min-h-[46vh] items-end overflow-hidden pb-24 pt-28 sm:min-h-[56vh]">
        <img src={heroImg} alt="" aria-hidden width={1600} height={1008} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        {showVideo && (
          <video className="absolute inset-0 -z-20 h-full w-full object-cover" autoPlay muted loop playsInline poster={heroImg} aria-hidden>
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        )}
        <div className="hero-overlay absolute inset-0 -z-10" />
        <div className="mx-auto w-full max-w-3xl animate-fade-up px-4 text-on-hero">
          <p className="text-sm uppercase tracking-[0.25em] opacity-80">Din digitala receptionist</p>
          <h1 className="mt-2 text-5xl sm:text-7xl">Hildur 4.0</h1>
          <p className="mt-3 max-w-md opacity-90">Välkommen! Jag hjälper dig med bokningar, felanmälan och frågor – dygnet runt.</p>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-16 max-w-3xl px-4 pb-16">
        <section aria-label="Chatt med Hildur" className="glass rounded-3xl p-4 sm:p-6">
          <div className="flex max-h-[55vh] min-h-[200px] flex-col gap-3 overflow-y-auto pr-1" role="log" aria-live="polite">
            {msgs.map((m) =>
              m.from === "hildur" ? (
                <div key={m.key} className="flex animate-fade-up items-end gap-2">
                  <div aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">H</div>
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-card px-4 py-3 text-[15px] leading-relaxed shadow-sm">{m.text}</div>
                </div>
              ) : (
                <div key={m.key} className="flex animate-fade-up justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-bubble-guest px-4 py-3 text-[15px] text-bubble-guest-foreground">{m.text}</div>
                </div>
              ),
            )}
            {typing && (
              <div className="flex items-end gap-2" aria-label="Hildur skriver">
                <div aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">H</div>
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-4 shadow-sm">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="animate-dot h-2 w-2 rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {name && (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Snabbval">
              {CHIPS.map((c) => (
                <button key={c.intent} onClick={() => chip(c)} className="tap rounded-full border border-primary/25 bg-card px-4 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">
                  {c.label}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="mt-4 flex gap-2">
            <label htmlFor="chat-input" className="sr-only">{name ? "Skriv ett meddelande" : "Ditt namn"}</label>
            <input
              id="chat-input"
              ref={inputRef}
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={name ? "Skriv till Hildur…" : "Skriv ditt namn…"}
              maxLength={200}
              autoComplete={name ? "off" : "given-name"}
              className="tap flex-1 rounded-full border border-input bg-card px-5 text-[15px] outline-none focus:border-ring"
            />
            <button type="submit" aria-label="Skicka" className="tap flex items-center justify-center rounded-full bg-primary px-4 text-primary-foreground disabled:opacity-50" disabled={!input.trim()}>
              <Send className="h-5 w-5" aria-hidden />
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
