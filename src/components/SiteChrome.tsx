import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useGuestName } from "@/lib/guest";
import { Button } from "@/components/ui/button";

export function Header() {
  const name = useGuestName();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const home = path === "/";
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
        {home ? (
          <span className={`font-display text-lg ${home ? "text-on-hero" : ""}`}>Hildur 4.0</span>
        ) : (
          <Link to="/" aria-label="Tillbaka till startsidan" className="glass tap inline-flex items-center gap-2 rounded-full px-4 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Startsidan
          </Link>
        )}
        {name && (
          <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm" aria-label={`Inloggad gäst: ${name}`}>
            <User className="h-4 w-4" aria-hidden /> {name}
          </span>
        )}
      </div>
    </header>
  );
}

export function OnlineStatus() {
  return (
    <span className="inline-flex items-center gap-2 text-sm" role="status">
      <span className="relative flex h-2.5 w-2.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
      </span>
      Hildur är online
    </span>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/50">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 py-6 text-muted-foreground sm:flex-row sm:justify-between">
        <nav aria-label="Sidfot" className="flex gap-2">
          <Link to="/cookies" className="tap inline-flex items-center rounded-lg px-3 text-sm hover:text-foreground">Cookies</Link>
          <Link to="/datasakerhet" className="tap inline-flex items-center rounded-lg px-3 text-sm hover:text-foreground">Hur din data skyddas</Link>
        </nav>
        <OnlineStatus />
      </div>
    </footer>
  );
}

const CK = "hildur_cookie_consent";
export function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(!localStorage.getItem(CK)), []);
  if (!show) return null;
  const choose = (v: string) => { localStorage.setItem(CK, v); setShow(false); };
  return (
    <div role="dialog" aria-label="Cookie-inställningar" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl animate-fade-up">
      <div className="glass rounded-2xl p-5">
        <p className="text-sm">
          Vi använder cookies för att appen ska fungera och för att förbättra din upplevelse.{" "}
          <Link to="/cookies" className="underline underline-offset-2">Läs mer</Link>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="tap rounded-full" onClick={() => choose("all")}>Acceptera</Button>
          <Button variant="outline" className="tap rounded-full" onClick={() => choose("necessary")}>Endast nödvändiga</Button>
        </div>
      </div>
    </div>
  );
}

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-24">
      <h1 className="mb-6 animate-fade-up text-3xl sm:text-4xl">{title}</h1>
      {children}
    </main>
  );
}

export function HildurSays({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex animate-fade-up items-start gap-3">
      <div aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-primary-foreground">H</div>
      <div className="glass rounded-2xl rounded-tl-sm px-4 py-3" aria-live="polite">{children}</div>
    </div>
  );
}
