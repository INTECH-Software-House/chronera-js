import { ChroneraError } from "../errors/errors.js";
import {
  instantFromDate,
  instantFromEpochMilliseconds,
} from "../core/instant.js";
import {
  projectInstantToZonedFields,
  validateTimeZone,
} from "../runtime/timezone.js";
import type {
  Instant,
  LocalDate,
  LocalDateTime,
  TimeZoneId,
} from "../public-types.js";
import { rruleToString, type RRuleOptions } from "./rrule.js";

export interface ICSOrganizer {
  readonly name?: string | undefined;
  readonly email: string;
}

export interface ICSAttendee {
  readonly name?: string | undefined;
  readonly email: string;
  readonly role?:
    | "REQ-PARTICIPANT"
    | "OPT-PARTICIPANT"
    | "NON-PARTICIPANT"
    | string
    | undefined;
  readonly partstat?:
    "NEEDS-ACTION" | "ACCEPTED" | "DECLINED" | "TENTATIVE" | string | undefined;
}

export interface ICSEventInput {
  readonly uid?: string | undefined;
  readonly title: string;
  readonly description?: string | undefined;
  readonly location?: string | undefined;
  readonly start: Date | Instant | LocalDate | LocalDateTime;
  readonly end?: Date | Instant | LocalDate | LocalDateTime | undefined;
  readonly durationMinutes?: number | undefined;
  readonly allDay?: boolean | undefined;
  readonly timeZone?: TimeZoneId | undefined;
  readonly status?: "CONFIRMED" | "TENTATIVE" | "CANCELLED" | undefined;
  readonly recurrence?: string | RRuleOptions | undefined;
  readonly organizer?: ICSOrganizer | undefined;
  readonly attendees?: readonly ICSAttendee[] | undefined;
  readonly url?: string | undefined;
}

export interface ICSCalendarOptions {
  readonly prodId?: string | undefined;
  readonly method?: "PUBLISH" | "REQUEST" | undefined;
  readonly calName?: string | undefined;
  readonly timeZone?: TimeZoneId | undefined;
}

export interface ParsedICSEvent {
  readonly uid: string;
  readonly summary: string;
  readonly description?: string | undefined;
  readonly location?: string | undefined;
  readonly start: Instant;
  readonly end?: Instant | undefined;
  readonly allDay: boolean;
  readonly rrule?: string | undefined;
  readonly status?: string | undefined;
  readonly organizer?: ICSOrganizer | undefined;
  readonly attendees: readonly ICSAttendee[];
  readonly url?: string | undefined;
}

export interface ParsedICSCalendar {
  readonly prodId?: string | undefined;
  readonly version?: string | undefined;
  readonly method?: string | undefined;
  readonly calName?: string | undefined;
  readonly events: readonly ParsedICSEvent[];
}

function escapeICSText(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\n|\r/g, "\\n");
}

function unescapeICSText(str: string): string {
  return str
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function getUtf8ByteLength(str: string): number {
  let bytes = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code <= 0x7f) {
      bytes += 1;
    } else if (code <= 0x7ff) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4;
      i++;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

function foldLine(line: string): string {
  const MAX_OCTETS = 75;
  if (getUtf8ByteLength(line) <= MAX_OCTETS) {
    return line;
  }

  let result = "";
  let remaining = line;
  let isFirst = true;

  while (remaining.length > 0) {
    const limit = isFirst ? MAX_OCTETS : MAX_OCTETS - 1; // 1 space prefix on continuation lines
    let sliceLen = 0;
    let byteCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const code = remaining.charCodeAt(i);
      let charBytes = 1;
      let charChars = 1;
      if (code <= 0x7f) {
        charBytes = 1;
      } else if (code <= 0x7ff) {
        charBytes = 2;
      } else if (code >= 0xd800 && code <= 0xdbff) {
        charBytes = 4;
        charChars = 2;
      } else {
        charBytes = 3;
      }

      if (byteCount + charBytes > limit) break;
      byteCount += charBytes;
      sliceLen += charChars;
      if (charChars === 2) i++;
    }

    if (sliceLen === 0) sliceLen = 1;

    const chunk = remaining.slice(0, sliceLen);
    remaining = remaining.slice(sliceLen);

    if (isFirst) {
      result += chunk;
      isFirst = false;
    } else {
      result += `\r\n ${chunk}`;
    }
  }

  return result;
}

function toInstant(input: Date | Instant | LocalDate | LocalDateTime): Instant {
  if (input instanceof Date) return instantFromDate(input);
  if (typeof input === "object" && input !== null && "kind" in input) {
    if (input.kind === "instant") return input as Instant;
    if (input.kind === "local-date") {
      const ld = input as LocalDate;
      return instantFromEpochMilliseconds(
        Date.UTC(ld.year, ld.month - 1, ld.day, 0, 0, 0),
      );
    }
    if (input.kind === "local-date-time") {
      const ldt = input as LocalDateTime;
      return instantFromEpochMilliseconds(
        Date.UTC(
          ldt.date.year,
          ldt.date.month - 1,
          ldt.date.day,
          ldt.time.hour,
          ldt.time.minute,
          ldt.time.second,
          ldt.time.millisecond,
        ),
      );
    }
  }
  throw new ChroneraError(
    "CHRONERA_INVALID_INSTANT",
    "Invalid date/time input for iCalendar",
  );
}

function formatICSDate(
  inst: Instant,
  allDay = false,
  timeZone?: TimeZoneId,
): { line: string } {
  if (allDay) {
    const d = new Date(inst.epochMilliseconds);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return { line: `;VALUE=DATE:${y}${m}${day}` };
  }

  if (timeZone) {
    validateTimeZone(timeZone);
    const z = projectInstantToZonedFields(inst, timeZone);
    const y = String(z.year).padStart(4, "0");
    const m = String(z.month).padStart(2, "0");
    const day = String(z.day).padStart(2, "0");
    const h = String(z.hour).padStart(2, "0");
    const mi = String(z.minute).padStart(2, "0");
    const s = String(z.second).padStart(2, "0");
    return { line: `;TZID=${timeZone}:${y}${m}${day}T${h}${mi}${s}` };
  }

  const d = new Date(inst.epochMilliseconds);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return { line: `:${y}${m}${day}T${h}${mi}${s}Z` };
}

function generateUID(): string {
  const rnd = Math.random().toString(36).slice(2, 11);
  const ts = Date.now().toString(36);
  return `${ts}-${rnd}@chronera.intech`;
}

export function generateICS(
  eventsInput: ICSEventInput | readonly ICSEventInput[],
  calendarOptions?: ICSCalendarOptions,
): string {
  const events = Array.isArray(eventsInput) ? eventsInput : [eventsInput];
  if (events.length === 0) {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "generateICS expects at least one event",
    );
  }

  const lines: string[] = [];

  // VCALENDAR header
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push(
    `PRODID:${calendarOptions?.prodId ?? "-//INTECH Software House//Chronera Calendar//EN"}`,
  );
  lines.push("CALSCALE:GREGORIAN");
  lines.push(`METHOD:${calendarOptions?.method ?? "PUBLISH"}`);

  if (calendarOptions?.calName) {
    lines.push(`X-WR-CALNAME:${escapeICSText(calendarOptions.calName)}`);
  }
  if (calendarOptions?.timeZone) {
    lines.push(`X-WR-TIMEZONE:${calendarOptions.timeZone}`);
  }

  const nowStamp = formatICSDate(instantFromEpochMilliseconds(Date.now())).line;

  // VEVENT blocks
  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    const uid = ev.uid ?? generateUID();
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP${nowStamp}`);

    const startInst = toInstant(ev.start);
    const startFormatted = formatICSDate(startInst, ev.allDay, ev.timeZone);
    lines.push(`DTSTART${startFormatted.line}`);

    if (ev.end) {
      const endInst = toInstant(ev.end);
      const endFormatted = formatICSDate(endInst, ev.allDay, ev.timeZone);
      lines.push(`DTEND${endFormatted.line}`);
    } else if (ev.durationMinutes && ev.durationMinutes > 0) {
      const endMs = startInst.epochMilliseconds + ev.durationMinutes * 60000;
      const endInst = instantFromEpochMilliseconds(endMs);
      const endFormatted = formatICSDate(endInst, ev.allDay, ev.timeZone);
      lines.push(`DTEND${endFormatted.line}`);
    }

    lines.push(`SUMMARY:${escapeICSText(ev.title)}`);

    if (ev.description) {
      lines.push(`DESCRIPTION:${escapeICSText(ev.description)}`);
    }
    if (ev.location) {
      lines.push(`LOCATION:${escapeICSText(ev.location)}`);
    }
    if (ev.status) {
      lines.push(`STATUS:${ev.status}`);
    }
    if (ev.url) {
      lines.push(`URL:${ev.url}`);
    }

    if (ev.recurrence) {
      const rruleStr =
        typeof ev.recurrence === "string"
          ? ev.recurrence.startsWith("RRULE:")
            ? ev.recurrence
            : `RRULE:${ev.recurrence}`
          : rruleToString(ev.recurrence);
      lines.push(rruleStr);
    }

    if (ev.organizer) {
      const cn = ev.organizer.name
        ? `;CN=${escapeICSText(ev.organizer.name)}`
        : "";
      lines.push(`ORGANIZER${cn}:mailto:${ev.organizer.email}`);
    }

    if (ev.attendees) {
      for (const att of ev.attendees) {
        const cn = att.name ? `;CN=${escapeICSText(att.name)}` : "";
        const role = att.role ? `;ROLE=${att.role}` : "";
        const partstat = att.partstat ? `;PARTSTAT=${att.partstat}` : "";
        lines.push(`ATTENDEE${cn}${role}${partstat}:mailto:${att.email}`);
      }
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  // Apply RFC 5545 line folding and CRLF endings
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function parseICS(icsContent: string): ParsedICSCalendar {
  if (!icsContent || typeof icsContent !== "string") {
    throw new ChroneraError(
      "CHRONERA_INVALID_DATE",
      "ICS content must be a non-empty string",
    );
  }

  // 1. Unfold lines (RFC 5545 Section 3.1: CRLF or LF followed by single space or tab)
  const unfolded = icsContent.replace(/\r?\n[ \t]/g, "");
  const rawLines = unfolded.split(/\r?\n/);

  let prodId: string | undefined;
  let version: string | undefined;
  let method: string | undefined;
  let calName: string | undefined;
  const events: ParsedICSEvent[] = [];

  let inEvent = false;
  let currentEventProps: Record<string, string> = {};
  const currentAttendees: ICSAttendee[] = [];

  function parseDateProp(val: string): { instant: Instant; allDay: boolean } {
    // Check if VALUE=DATE:YYYYMMDD
    const dateMatch = val.match(/(\d{4})(\d{2})(\d{2})$/);
    const dateTimeMatch = val.match(
      /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/,
    );

    if (dateTimeMatch) {
      const y = parseInt(dateTimeMatch[1]!, 10);
      const mo = parseInt(dateTimeMatch[2]!, 10);
      const d = parseInt(dateTimeMatch[3]!, 10);
      const h = parseInt(dateTimeMatch[4]!, 10);
      const mi = parseInt(dateTimeMatch[5]!, 10);
      const s = parseInt(dateTimeMatch[6]!, 10);
      return {
        instant: instantFromEpochMilliseconds(Date.UTC(y, mo - 1, d, h, mi, s)),
        allDay: false,
      };
    } else if (dateMatch) {
      const y = parseInt(dateMatch[1]!, 10);
      const mo = parseInt(dateMatch[2]!, 10);
      const d = parseInt(dateMatch[3]!, 10);
      return {
        instant: instantFromEpochMilliseconds(Date.UTC(y, mo - 1, d, 0, 0, 0)),
        allDay: true,
      };
    }
    throw new ChroneraError(
      "CHRONERA_PARSE_FAILED",
      `Cannot parse ICS date: "${val}"`,
    );
  }

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === "BEGIN:VEVENT") {
      inEvent = true;
      currentEventProps = {};
      currentAttendees.length = 0;
      continue;
    }

    if (trimmed === "END:VEVENT") {
      if (inEvent && currentEventProps["SUMMARY"]) {
        const rawStart = currentEventProps["DTSTART"] ?? "";
        const parsedStart = parseDateProp(rawStart);

        let endInst: Instant | undefined;
        if (currentEventProps["DTEND"]) {
          endInst = parseDateProp(currentEventProps["DTEND"]).instant;
        }

        let organizer: ICSOrganizer | undefined;
        if (currentEventProps["ORGANIZER"]) {
          const orgVal = currentEventProps["ORGANIZER"];
          const mailMatch = orgVal.match(/mailto:(.*)$/i);
          const cnMatch = currentEventProps["ORGANIZER_CN"];
          organizer = {
            email: mailMatch ? mailMatch[1]!.trim() : orgVal,
            name: cnMatch ? unescapeICSText(cnMatch) : undefined,
          };
        }

        events.push({
          uid: currentEventProps["UID"] ?? generateUID(),
          summary: unescapeICSText(currentEventProps["SUMMARY"] ?? ""),
          description: currentEventProps["DESCRIPTION"]
            ? unescapeICSText(currentEventProps["DESCRIPTION"])
            : undefined,
          location: currentEventProps["LOCATION"]
            ? unescapeICSText(currentEventProps["LOCATION"])
            : undefined,
          start: parsedStart.instant,
          end: endInst,
          allDay: parsedStart.allDay,
          rrule: currentEventProps["RRULE"],
          status: currentEventProps["STATUS"],
          organizer,
          attendees: [...currentAttendees],
          url: currentEventProps["URL"],
        });
      }
      inEvent = false;
      continue;
    }

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const keyPart = trimmed.slice(0, colonIdx);
    const value = trimmed.slice(colonIdx + 1);

    if (!inEvent) {
      if (keyPart === "PRODID") prodId = value;
      else if (keyPart === "VERSION") version = value;
      else if (keyPart === "METHOD") method = value;
      else if (keyPart === "X-WR-CALNAME") calName = unescapeICSText(value);
    } else {
      const keyParts = keyPart.split(";");
      const mainKey = keyParts[0]!.toUpperCase();

      if (mainKey === "ATTENDEE") {
        let cn: string | undefined;
        let role: string | undefined;
        let partstat: string | undefined;
        for (const p of keyParts.slice(1)) {
          const [pk, pv] = p.split("=");
          if (pk?.toUpperCase() === "CN")
            cn = pv ? unescapeICSText(pv) : undefined;
          if (pk?.toUpperCase() === "ROLE") role = pv;
          if (pk?.toUpperCase() === "PARTSTAT") partstat = pv;
        }
        const mailto = value.replace(/^mailto:/i, "").trim();
        currentAttendees.push({ email: mailto, name: cn, role, partstat });
      } else if (mainKey === "ORGANIZER") {
        currentEventProps["ORGANIZER"] = value;
        for (const p of keyParts.slice(1)) {
          const [pk, pv] = p.split("=");
          if (pk?.toUpperCase() === "CN")
            currentEventProps["ORGANIZER_CN"] = pv ?? "";
        }
      } else {
        currentEventProps[mainKey] = value;
      }
    }
  }

  return {
    prodId,
    version,
    method,
    calName,
    events,
  };
}
