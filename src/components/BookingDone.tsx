import { Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { formatDay } from "@/lib/guest";

export function BookingDone({ code, lines }: { code: string; lines: string[] }) {
  return (
    <div className="glass animate-fade-up rounded-2xl p-6">
      <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
      <h2 className="mt-3 text-2xl">Bokningen är bekräftad</h2>
      <ul className="mt-3 space-y-1 text-sm">{lines.map((l) => <li key={l}>{l}</li>)}</ul>
      <p className="mt-4 text-sm">Din bokningskod: <strong className="font-mono text-base tracking-widest">{code}</strong></p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/avboka" className="tap inline-flex items-center rounded-full border border-input px-5 text-sm font-medium">Avboka</Link>
        <Link to="/" className="tap inline-flex items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">Till startsidan</Link>
      </div>
    </div>
  );
}
export { formatDay };
