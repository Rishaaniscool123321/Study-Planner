import { Router, type IRouter, type Request, type Response as ExpressResponse } from "express";
import { and, eq } from "drizzle-orm";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import ICAL from "ical.js";
import { db, studySessionsTable, subjectsTable } from "@workspace/db";
import { ImportIcalBody, ImportIcalUrlBody } from "@workspace/api-zod";

const router: IRouter = Router();

const MAX_ICS_BYTES = 1_500_000;
const DEFAULT_WINDOW_DAYS = 90;
const MAX_EVENTS_PER_IMPORT = 500;
const MAX_RECUR_ITERATIONS_PER_EVENT = 5_000;
const FETCH_TIMEOUT_MS = 15_000;

function requireAuth(req: Request, res: ExpressResponse): boolean {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}

async function ensureSubjectOwned(
  subjectId: number | null | undefined,
  userId: string,
): Promise<boolean> {
  if (subjectId == null) return true;
  const [row] = await db
    .select({ id: subjectsTable.id })
    .from(subjectsTable)
    .where(and(eq(subjectsTable.id, subjectId), eq(subjectsTable.userId, userId)));
  return !!row;
}

// --- SSRF guard ------------------------------------------------------------

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local + AWS metadata 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local
  if (lower.startsWith("fe80")) return true; // link-local
  if (lower.startsWith("ff")) return true; // multicast
  if (lower.startsWith("::ffff:")) {
    const v4 = lower.slice(7);
    return isPrivateIPv4(v4);
  }
  return false;
}

async function assertPublicHost(hostname: string): Promise<void> {
  // If hostname is itself an IP literal, check directly without DNS.
  const literal = isIP(hostname);
  const addrs: { address: string; family: number }[] = literal
    ? [{ address: hostname, family: literal }]
    : await lookup(hostname, { all: true });
  for (const a of addrs) {
    if (a.family === 4 && isPrivateIPv4(a.address)) {
      throw new Error("Refusing to fetch from private/internal address");
    }
    if (a.family === 6 && isPrivateIPv6(a.address)) {
      throw new Error("Refusing to fetch from private/internal address");
    }
  }
}

async function safeFetchIcs(rawUrl: string): Promise<string> {
  let url = new URL(rawUrl.replace(/^webcal:/i, "https:"));
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  const portStr = url.port;
  if (portStr) {
    const port = Number(portStr);
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      throw new Error("Invalid port");
    }
  }

  // Manual redirect handling so we re-validate every hop.
  let hops = 0;
  while (true) {
    if (hops++ > 5) throw new Error("Too many redirects");
    await assertPublicHost(url.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: { Accept: "text/calendar, text/plain, */*" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (resp.status >= 300 && resp.status < 400) {
      const loc = resp.headers.get("location");
      if (!loc) throw new Error(`Redirect without Location (${resp.status})`);
      url = new URL(loc, url);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Redirect to non-http(s) URL");
      }
      continue;
    }
    if (!resp.ok) throw new Error(`Fetch failed (${resp.status})`);

    // Read with a size cap so we don't buffer huge responses.
    const reader = resp.body?.getReader();
    if (!reader) return await resp.text();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_ICS_BYTES) {
        try { await reader.cancel(); } catch { /* ignore */ }
        throw new Error("Remote ICS payload too large");
      }
      chunks.push(value);
    }
    return new TextDecoder("utf-8").decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
  }
}

// --- Parsing / expansion ---------------------------------------------------

type ParsedEvent = {
  uid: string;
  summary: string;
  date: string;       // yyyy-MM-dd in the event's own timezone (floating)
  startTime: string;  // HH:MM
  endTime: string | null;
  durationMinutes: number | null;
};

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function icalTimeToFields(t: ICAL.Time): {
  date: string;
  time: string;
} {
  // Use ICAL.Time's own fields directly — these are in the event's declared
  // timezone (or floating). Avoids server-local Date coercion.
  return {
    date: `${t.year}-${pad(t.month)}-${pad(t.day)}`,
    time: `${pad(t.hour)}:${pad(t.minute)}`,
  };
}

function diffMinutes(a: ICAL.Time, b: ICAL.Time): number {
  // ICAL.Time.subtractDate returns an ICAL.Duration in seconds.
  const dur = b.subtractDate(a);
  return Math.max(1, Math.round(Math.abs(dur.toSeconds()) / 60));
}

function expandEvents(icsText: string, windowDays: number): ParsedEvent[] {
  const jcal = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcal);
  const vevents = comp.getAllSubcomponents("vevent");
  const nowMs = Date.now();
  const horizonEndMs = nowMs + windowDays * 86_400_000;
  const horizonStartMs = nowMs - 7 * 86_400_000;
  const out: ParsedEvent[] = [];

  for (const ve of vevents) {
    if (out.length >= MAX_EVENTS_PER_IMPORT) break;
    const event = new ICAL.Event(ve);
    if (!event.startDate) continue;
    const baseUid = event.uid || `${event.summary}-${event.startDate.toString()}`;
    const summary = event.summary || "Imported session";

    if (event.isRecurring()) {
      const iter = event.iterator();
      let steps = 0;
      let next: ICAL.Time | null;
      while ((next = iter.next())) {
        if (++steps > MAX_RECUR_ITERATIONS_PER_EVENT) break;
        const startMs = next.toUnixTime() * 1000;
        if (startMs > horizonEndMs) break;
        if (startMs < horizonStartMs) continue;
        const details = event.getOccurrenceDetails(next);
        const startFields = icalTimeToFields(details.startDate);
        const endTimeStr = details.endDate ? icalTimeToFields(details.endDate).time : null;
        const dur = details.endDate ? diffMinutes(details.startDate, details.endDate) : null;
        out.push({
          uid: `${baseUid}@${next.toString()}`,
          summary,
          date: startFields.date,
          startTime: startFields.time,
          endTime: endTimeStr,
          durationMinutes: dur,
        });
        if (out.length >= MAX_EVENTS_PER_IMPORT) break;
      }
    } else {
      const startMs = event.startDate.toUnixTime() * 1000;
      if (startMs > horizonEndMs || startMs < horizonStartMs) continue;
      const sf = icalTimeToFields(event.startDate);
      const endTimeStr = event.endDate ? icalTimeToFields(event.endDate).time : null;
      const dur = event.endDate ? diffMinutes(event.startDate, event.endDate) : null;
      out.push({
        uid: baseUid,
        summary,
        date: sf.date,
        startTime: sf.time,
        endTime: endTimeStr,
        durationMinutes: dur,
      });
    }
  }
  return out;
}

async function importParsed(
  events: ParsedEvent[],
  userId: string,
  defaultSubjectId: number | null,
  sourceUrl: string | null,
): Promise<{ imported: number; updated: number; skipped: number; total: number }> {
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const ev of events) {
    const values = {
      userId,
      subjectId: defaultSubjectId,
      date: ev.date,
      startTime: ev.startTime,
      endTime: ev.endTime,
      durationMinutes: ev.durationMinutes,
      sessionType: "regular" as const,
      notes: ev.summary,
      externalUid: ev.uid,
      sourceUrl,
    };

    const [existing] = await db
      .select({ id: studySessionsTable.id })
      .from(studySessionsTable)
      .where(
        and(
          eq(studySessionsTable.userId, userId),
          eq(studySessionsTable.externalUid, ev.uid),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(studySessionsTable)
        .set({
          date: values.date,
          startTime: values.startTime,
          endTime: values.endTime,
          durationMinutes: values.durationMinutes,
          notes: values.notes,
          sourceUrl: values.sourceUrl,
        })
        .where(eq(studySessionsTable.id, existing.id));
      updated += 1;
    } else {
      try {
        await db.insert(studySessionsTable).values(values);
        imported += 1;
      } catch {
        skipped += 1;
      }
    }
  }

  return { imported, updated, skipped, total: events.length };
}

router.post("/sessions/import-ical", async (req: Request, res: ExpressResponse): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const parsed = ImportIcalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (parsed.data.ics.length > MAX_ICS_BYTES) {
    res.status(413).json({ error: "ICS payload too large" });
    return;
  }
  const defaultSubjectId = parsed.data.defaultSubjectId ?? null;
  if (!(await ensureSubjectOwned(defaultSubjectId, req.user!.id))) {
    res.status(400).json({ error: "Invalid defaultSubjectId" });
    return;
  }
  let events: ParsedEvent[];
  try {
    events = expandEvents(parsed.data.ics, parsed.data.windowDays ?? DEFAULT_WINDOW_DAYS);
  } catch (err) {
    req.log.warn({ err }, "ical parse failed");
    res.status(400).json({ error: "Could not parse iCalendar data" });
    return;
  }
  const result = await importParsed(events, req.user!.id, defaultSubjectId, parsed.data.sourceUrl ?? null);
  res.json(result);
});

router.post("/sessions/import-ical-url", async (req: Request, res: ExpressResponse): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const parsed = ImportIcalUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const defaultSubjectId = parsed.data.defaultSubjectId ?? null;
  if (!(await ensureSubjectOwned(defaultSubjectId, req.user!.id))) {
    res.status(400).json({ error: "Invalid defaultSubjectId" });
    return;
  }

  let icsText: string;
  let finalUrl: string;
  try {
    finalUrl = new URL(parsed.data.url.replace(/^webcal:/i, "https:")).toString();
    icsText = await safeFetchIcs(parsed.data.url);
  } catch (err) {
    req.log.warn({ err }, "ical fetch failed");
    const msg = err instanceof Error ? err.message : "Could not fetch the iCalendar URL";
    res.status(400).json({ error: msg });
    return;
  }

  let events: ParsedEvent[];
  try {
    events = expandEvents(icsText, parsed.data.windowDays ?? DEFAULT_WINDOW_DAYS);
  } catch (err) {
    req.log.warn({ err }, "ical parse failed");
    res.status(400).json({ error: "Could not parse iCalendar data" });
    return;
  }
  const result = await importParsed(events, req.user!.id, defaultSubjectId, finalUrl);
  res.json(result);
});

// --- Export ---------------------------------------------------------------

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function toFloatingIcsDateTime(date: string, time: string): string {
  const [y, m, d] = date.split("-");
  const [hh, mm] = time.split(":");
  return `${y}${m}${d}T${(hh ?? "00").padStart(2, "0")}${(mm ?? "00").padStart(2, "0")}00`;
}

router.get("/sessions/export.ics", async (req: Request, res: ExpressResponse): Promise<void> => {
  if (!requireAuth(req, res)) return;
  const sessions = await db
    .select()
    .from(studySessionsTable)
    .where(eq(studySessionsTable.userId, req.user!.id));
  const subjects = await db
    .select()
    .from(subjectsTable)
    .where(eq(subjectsTable.userId, req.user!.id));
  const subjectsById = new Map(subjects.map((s) => [s.id, s]));

  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Study Planner//EN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Study Planner",
  ];
  for (const s of sessions) {
    const subj = s.subjectId != null ? subjectsById.get(s.subjectId) : null;
    const title = subj?.name ?? "Study session";
    const dtstart = toFloatingIcsDateTime(s.date, s.startTime);
    const endTime = s.endTime
      ?? (s.durationMinutes
        ? (() => {
            const [hh, mm] = s.startTime.split(":").map((v) => parseInt(v, 10));
            const total = hh * 60 + mm + s.durationMinutes!;
            const eh = Math.floor((total % 1440) / 60);
            const em = total % 60;
            return `${pad(eh)}:${pad(em)}`;
          })()
        : s.startTime);
    const dtend = toFloatingIcsDateTime(s.date, endTime);
    const uid = s.externalUid ?? `study-${s.id}@study-planner`;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    // Floating local time (no Z, no TZID) — matches how we store inbound iCal events.
    lines.push(`DTSTART:${dtstart}`);
    lines.push(`DTEND:${dtend}`);
    lines.push(`SUMMARY:${icsEscape(title)}`);
    if (s.notes && s.notes !== title) lines.push(`DESCRIPTION:${icsEscape(s.notes)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="study-planner.ics"');
  res.send(lines.join("\r\n"));
});

export default router;
