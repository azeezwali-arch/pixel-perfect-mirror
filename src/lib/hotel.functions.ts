import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const admin = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;

const nameSchema = z.string().trim().min(1).max(60);

export const getAvailability = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ type: z.enum(["frukost", "bastu"]), from: z.string(), to: z.string() }).parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("bookings")
      .select("date,time,room,persons")
      .eq("type", data.type)
      .eq("status", "aktiv")
      .gte("date", data.from)
      .lte("date", data.to);
    if (error) throw new Error("Kunde inte hämta tillgänglighet");
    const counts: Record<string, number> = {};
    for (const r of rows ?? []) {
      const k = `${r.date}|${r.time}|${r.room ?? ""}`;
      counts[k] = (counts[k] ?? 0) + r.persons;
    }
    return counts;
  });

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const a = crypto.getRandomValues(new Uint8Array(6));
  for (const b of a) s += chars[b % chars.length];
  return s;
}

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        type: z.enum(["frukost", "bastu"]),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.string().max(20),
        room: z.enum(["Matsal 1", "Matsal 2"]).nullable(),
        persons: z.number().int().min(1).max(30),
        guestName: nameSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    if (data.type === "frukost" && !data.room) throw new Error("Välj matsal");
    if (data.type === "bastu" && data.persons > 8) throw new Error("Max 8 personer per pass");
    const db = await admin();
    const code = makeCode();
    const { data: rec, error } = await db.rpc("create_booking", {
      _type: data.type,
      _date: data.date,
      _time: data.time,
      _room: data.type === "bastu" ? null : data.room,
      _persons: data.persons,
      _guest_name: data.guestName,
      _code: code,
    } as never);
    if (error) {
      if (error.message.includes("FULLT")) return { ok: false as const, error: "Det finns inte tillräckligt med platser kvar." };
      return { ok: false as const, error: "Bokningen kunde inte sparas." };
    }
    const b = rec as unknown as { id: string; code: string };
    return { ok: true as const, id: b.id, code: b.code };
  });

export const listBookings = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ guestName: nameSchema, code: z.string().trim().max(12).optional() }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    let q = db
      .from("bookings")
      .select("id,type,date,time,room,persons,code")
      .ilike("guest_name", data.guestName)
      .eq("status", "aktiv")
      .order("date")
      .order("time");
    if (data.code) q = q.eq("code", data.code.toUpperCase());
    const { data: rows, error } = await q;
    if (error) throw new Error("Kunde inte hämta bokningar");
    return rows ?? [];
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), guestName: nameSchema }).parse(d))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("bookings")
      .update({ status: "avbokad" })
      .eq("id", data.id)
      .ilike("guest_name", data.guestName)
      .select("id");
    if (error || !rows?.length) return { ok: false };
    return { ok: true };
  });

export const reportFault = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        guestName: nameSchema,
        location: z.string().trim().min(1).max(100),
        category: z.string().trim().min(1).max(50),
        description: z.string().trim().min(3).max(2000),
        image: z
          .object({ base64: z.string().max(7_000_000), type: z.enum(["image/jpeg", "image/png", "image/webp"]) })
          .nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    let image_path: string | null = null;
    if (data.image) {
      const ext = data.image.type.split("/")[1];
      const path = `${crypto.randomUUID()}.${ext}`;
      const bytes = Uint8Array.from(atob(data.image.base64), (c) => c.charCodeAt(0));
      const { error } = await db.storage.from("fault-images").upload(path, bytes, { contentType: data.image.type });
      if (!error) image_path = path;
    }
    const { error } = await db.from("fault_reports").insert({
      guest_name: data.guestName,
      location: data.location,
      category: data.category,
      description: data.description,
      image_path,
    });
    if (error) return { ok: false };
    return { ok: true };
  });
