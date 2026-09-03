import { MAX_ABSOLUTE_DAY, MIN_ABSOLUTE_DAY } from "../../core/absolute-day.js";

import type { CalendarIdentity } from "../types.js";

export const GREGORIAN_IDENTITY: CalendarIdentity = {
  id: "gregory",
  algorithm: "chronera-proleptic-gregorian-v1",
  deterministic: true,
  validRange: {
    first: MIN_ABSOLUTE_DAY,
    last: MAX_ABSOLUTE_DAY,
  },
  validFrom: { kind: "local-date", year: 1, month: 1, day: 1 },
  validTo: { kind: "local-date", year: 9999, month: 12, day: 31 },
};

export const ISO8601_IDENTITY: CalendarIdentity = {
  ...GREGORIAN_IDENTITY,
  id: "iso8601",
  algorithm: "chronera-iso8601-civil-v1",
};
