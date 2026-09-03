import { MAX_ABSOLUTE_DAY, MIN_ABSOLUTE_DAY } from "../../core/absolute-day.js";

import type { CalendarIdentity } from "../types.js";

export const BUDDHIST_ERA_YEAR_OFFSET = 543;

export const BUDDHIST_IDENTITY: CalendarIdentity = {
  id: "buddhist",
  algorithm: "chronera-buddhist-v1",
  deterministic: true,
  validRange: {
    first: MIN_ABSOLUTE_DAY,
    last: MAX_ABSOLUTE_DAY,
  },
  validFrom: { kind: "local-date", year: 1, month: 1, day: 1 },
  validTo: { kind: "local-date", year: 9999, month: 12, day: 31 },
};
