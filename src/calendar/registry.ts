import { gregorianAdapter, iso8601Adapter } from "./gregory/adapter.js";
import { buddhistAdapter } from "./buddhist/adapter.js";
import {
  islamicCivilAdapter,
  islamicTblaAdapter,
  islamicUmalquraAdapter,
} from "./hijri/index.js";
import { japaneseAdapter } from "./japanese/index.js";
import { rocAdapter } from "./roc/index.js";
import { persianAdapter } from "./persian/index.js";
import { indianAdapter } from "./indian/index.js";
import { ChroneraError } from "../errors/errors.js";
import {
  absoluteDayFromGregorian,
  gregorianFromAbsoluteDay,
} from "./gregory/absolute-day.js";

import type { CalendarAdapter } from "./types.js";
import type {
  CalendarDate,
  CalendarId,
  CalendarPlugin,
  ChroneraIssue,
  LocalDate,
  MonthCode,
} from "../public-types.js";

const BUILT_IN_ADAPTERS = new Map<string, CalendarAdapter>([
  ["gregory", gregorianAdapter],
  ["iso8601", iso8601Adapter],
  ["buddhist", buddhistAdapter],
  ["islamic-civil", islamicCivilAdapter],
  ["islamic-tbla", islamicTblaAdapter],
  ["islamic-umalqura", islamicUmalquraAdapter],
  ["japanese", japaneseAdapter],
  ["roc", rocAdapter],
  ["persian", persianAdapter],
  ["indian", indianAdapter],
]);

export class CalendarRegistry {
  private readonly adapters = new Map<string, CalendarAdapter>(
    BUILT_IN_ADAPTERS,
  );

  constructor(customPlugins?: readonly CalendarPlugin[]) {
    if (customPlugins) {
      if (customPlugins.length > 64) {
        throw new ChroneraError(
          "CHRONERA_INPUT_TOO_LARGE",
          `Custom calendar plugins exceed maximum limit of 64; received ${customPlugins.length}.`,
        );
      }

      for (const plugin of customPlugins) {
        if (BUILT_IN_ADAPTERS.has(plugin.id)) {
          throw new ChroneraError(
            "CHRONERA_INCOMPATIBLE_OPTION",
            `Overriding built-in calendar adapter "${plugin.id}" is forbidden.`,
          );
        }

        const adapter: CalendarAdapter = {
          identity: {
            id: plugin.id,
            algorithm: plugin.algorithm,
            deterministic: plugin.deterministic,
            validRange: {
              first: absoluteDayFromGregorian({
                year: plugin.validFrom.year,
                monthCode:
                  `M${String(plugin.validFrom.month).padStart(2, "0")}` as MonthCode,
                day: plugin.validFrom.day,
              }),
              last: absoluteDayFromGregorian({
                year: plugin.validTo.year,
                monthCode:
                  `M${String(plugin.validTo.month).padStart(2, "0")}` as MonthCode,
                day: plugin.validTo.day,
              }),
            },
            validFrom: plugin.validFrom,
            validTo: plugin.validTo,
          },
          converter: {
            identity: {
              id: plugin.id,
              algorithm: plugin.algorithm,
              deterministic: plugin.deterministic,
              validRange: {
                first: -719162,
                last: 2932896,
              },
            },
            toAbsoluteDay(date: CalendarDate): number {
              const iso = plugin.toIsoDate(date);
              return absoluteDayFromGregorian({
                year: iso.year,
                monthCode:
                  `M${String(iso.month).padStart(2, "0")}` as MonthCode,
                day: iso.day,
              });
            },
            fromAbsoluteDay(day: number): CalendarDate {
              const greg = gregorianFromAbsoluteDay(day);
              const iso: LocalDate = {
                kind: "local-date",
                year: greg.year,
                month: greg.month,
                day: greg.day,
              };
              return plugin.fromIsoDate(iso);
            },
          },
          validator: {
            identity: {
              id: plugin.id,
              algorithm: plugin.algorithm,
              deterministic: plugin.deterministic,
              validRange: {
                first: -719162,
                last: 2932896,
              },
            },
            validate(date: CalendarDate): readonly ChroneraIssue[] {
              return plugin.validate(date);
            },
            daysInMonth(_year: number, _monthCode: MonthCode): number {
              return 30;
            },
            isLeapYear(_year: number): boolean {
              return false;
            },
          },
        };

        this.adapters.set(plugin.id, adapter);
      }
    }
  }

  getAdapter(id: CalendarId): CalendarAdapter {
    const adapter = this.adapters.get(id);
    if (!adapter) {
      throw new ChroneraError(
        "CHRONERA_UNSUPPORTED_CALENDAR",
        `Unsupported calendar identifier: "${id}".`,
      );
    }
    return adapter;
  }

  hasAdapter(id: CalendarId): boolean {
    return this.adapters.has(id);
  }
}

export const defaultCalendarRegistry = new CalendarRegistry();
