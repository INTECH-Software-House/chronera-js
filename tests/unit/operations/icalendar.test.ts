import { describe, it, expect } from "vitest";
import { generateICS, parseICS } from "../../../src/operations/icalendar.js";
import { localDateTime } from "../../../src/core/local-date-time.js";
import { localDate } from "../../../src/core/local-date.js";
import { localTime } from "../../../src/core/local-time.js";
import { instantFromEpochMilliseconds } from "../../../src/core/instant.js";

describe("iCalendar (RFC 5545) Engine", () => {
  describe("generateICS", () => {
    it("generates valid RFC 5545 VCALENDAR with a standard event", () => {
      const start = localDateTime(localDate(2026, 9, 21), localTime(10, 0, 0));
      const end = localDateTime(localDate(2026, 9, 21), localTime(11, 30, 0));

      const ics = generateICS({
        title: "Sprint Planning Q4",
        start,
        end,
        description: "Quarterly sprint planning meeting with product team.",
        location: "Zoom / Room 402",
        status: "CONFIRMED",
      });

      expect(ics).toContain("BEGIN:VCALENDAR\r\n");
      expect(ics).toContain("VERSION:2.0\r\n");
      expect(ics).toContain("BEGIN:VEVENT\r\n");
      expect(ics).toContain("SUMMARY:Sprint Planning Q4\r\n");
      expect(ics).toContain("LOCATION:Zoom / Room 402\r\n");
      expect(ics).toContain("STATUS:CONFIRMED\r\n");
      expect(ics).toContain("DTSTART:20260921T100000Z\r\n");
      expect(ics).toContain("DTEND:20260921T113000Z\r\n");
      expect(ics).toContain("END:VEVENT\r\n");
      expect(ics).toContain("END:VCALENDAR\r\n");
    });

    it("supports all-day events", () => {
      const start = localDate(2026, 9, 25);
      const ics = generateICS({
        title: "Company Hackathon",
        start,
        allDay: true,
      });

      expect(ics).toContain("DTSTART;VALUE=DATE:20260925\r\n");
    });

    it("supports organizer and attendees", () => {
      const start = localDateTime(localDate(2026, 9, 21), localTime(14, 0, 0));
      const ics = generateICS({
        title: "Tech Sync",
        start,
        durationMinutes: 60,
        organizer: { name: "John Doe", email: "john@example.com" },
        attendees: [
          {
            name: "Alice Smith",
            email: "alice@example.com",
            role: "REQ-PARTICIPANT",
          },
          { name: "Bob", email: "bob@example.com" },
        ],
      });

      expect(ics).toContain(
        "ORGANIZER;CN=John Doe:mailto:john@example.com\r\n",
      );
      expect(ics).toContain(
        "ATTENDEE;CN=Alice Smith;ROLE=REQ-PARTICIPANT:mailto:alice@example.com\r\n",
      );
      expect(ics).toContain("ATTENDEE;CN=Bob:mailto:bob@example.com\r\n");
    });

    it("escapes special characters properly in text fields", () => {
      const ics = generateICS({
        title: "Meeting: Review, Action; Items",
        start: localDateTime(localDate(2026, 9, 21), localTime(10, 0, 0)),
        description: "Line 1\nLine 2; with semicolons, and commas.",
      });

      expect(ics).toContain("SUMMARY:Meeting: Review\\, Action\\; Items\r\n");
      expect(ics).toContain(
        "DESCRIPTION:Line 1\\nLine 2\\; with semicolons\\, and commas.\r\n",
      );
    });

    it("folds long lines exceeding 75 octets according to RFC 5545 Section 3.1", () => {
      const longTitle = "A".repeat(120);
      const ics = generateICS({
        title: longTitle,
        start: localDate(2026, 9, 21),
      });

      // Must contain CRLF followed by a space
      expect(ics).toContain("\r\n ");
      const lines = ics.split("\r\n");
      for (const line of lines) {
        expect(Buffer.byteLength(line, "utf8")).toBeLessThanOrEqual(75);
      }
    });

    it("throws on empty events array", () => {
      expect(() => generateICS([])).toThrow();
    });
  });

  describe("parseICS", () => {
    it("parses valid ICS file content into structured objects", () => {
      const rawICS = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Example Corp//EN",
        "BEGIN:VEVENT",
        "UID:event-12345@example.com",
        "DTSTART:20260921T100000Z",
        "DTEND:20260921T113000Z",
        "SUMMARY:Architecture Review",
        "DESCRIPTION:Deep-dive session\\nCovering system design.",
        "LOCATION:Conference Room B",
        "STATUS:CONFIRMED",
        "ORGANIZER;CN=Lead Architect:mailto:lead@example.com",
        "ATTENDEE;CN=Senior Engineer;ROLE=REQ-PARTICIPANT:mailto:senior@example.com",
        "RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=5",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n");

      const parsed = parseICS(rawICS);
      expect(parsed.prodId).toBe("-//Example Corp//EN");
      expect(parsed.version).toBe("2.0");
      expect(parsed.events).toHaveLength(1);

      const ev = parsed.events[0]!;
      expect(ev.uid).toBe("event-12345@example.com");
      expect(ev.summary).toBe("Architecture Review");
      expect(ev.description).toBe("Deep-dive session\nCovering system design.");
      expect(ev.location).toBe("Conference Room B");
      expect(ev.status).toBe("CONFIRMED");
      expect(ev.rrule).toBe("FREQ=WEEKLY;BYDAY=MO;COUNT=5");
      expect(ev.organizer?.name).toBe("Lead Architect");
      expect(ev.organizer?.email).toBe("lead@example.com");
      expect(ev.attendees).toHaveLength(1);
      expect(ev.attendees[0]!.email).toBe("senior@example.com");

      // Verify dates
      const startDate = new Date(ev.start.epochMilliseconds);
      expect(startDate.getUTCFullYear()).toBe(2026);
      expect(startDate.getUTCMonth()).toBe(8); // September (0-indexed)
      expect(startDate.getUTCDate()).toBe(21);
      expect(startDate.getUTCHours()).toBe(10);
      expect(startDate.getUTCMinutes()).toBe(0);
    });

    it("round-trips generation and parsing seamlessly", () => {
      const originalStart = instantFromEpochMilliseconds(
        Date.UTC(2026, 8, 21, 15, 0, 0),
      );
      const originalEnd = instantFromEpochMilliseconds(
        Date.UTC(2026, 8, 21, 16, 0, 0),
      );

      const icsText = generateICS({
        title: "Roundtrip Test Event",
        start: originalStart,
        end: originalEnd,
        description: "Testing seamless round-trip preservation.",
        location: "Virtual",
      });

      const parsed = parseICS(icsText);
      expect(parsed.events).toHaveLength(1);
      const ev = parsed.events[0]!;
      expect(ev.summary).toBe("Roundtrip Test Event");
      expect(ev.description).toBe("Testing seamless round-trip preservation.");
      expect(ev.location).toBe("Virtual");
      expect(ev.start.epochMilliseconds).toBe(originalStart.epochMilliseconds);
      expect(ev.end?.epochMilliseconds).toBe(originalEnd.epochMilliseconds);
    });

    it("throws on invalid ICS content", () => {
      expect(() => parseICS("")).toThrow();
    });
  });
});
