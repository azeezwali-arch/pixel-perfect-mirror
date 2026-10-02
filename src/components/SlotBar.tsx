import { level } from "@/lib/guest";

export function SlotBar({ booked, cap }: { booked: number; cap: number }) {
  const l = level(booked, cap);
  const left = Math.max(cap - booked, 0);
  const color = l === "full" ? "bg-destructive" : l === "low" ? "bg-warning" : "bg-success";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{booked} av {cap} bokade</span>
        <span className="font-medium text-foreground">{l === "full" ? "Fullt" : `${left} platser kvar`}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={booked}>
        <div className={`h-full ${color} transition-all`} style={{ width: `${Math.min(100, (booked / cap) * 100)}%` }} />
      </div>
    </div>
  );
}
