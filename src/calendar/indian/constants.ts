import { MAX_ABSOLUTE_DAY } from "../../core/absolute-day.js";
import type { CalendarIdentity } from "../types.js";

export const SAKA_OFFSET = 78;

// 1 Chaitra 1 Saka = 79-03-24 CE (or March 22). Absolute day: -690623
export const INDIAN_IDENTITY: CalendarIdentity = {
  id: "indian",
  algorithm: "chronera-indian-saka-v1",
  deterministic: true,
  validRange: {
    first: -690623,
    last: MAX_ABSOLUTE_DAY,
  },
  validFrom: { kind: "local-date", year: 79, month: 3, day: 22 },
  validTo: { kind: "local-date", year: 9999, month: 12, day: 31 },
};

export const INDIAN_MONTH_NAMES = [
  "Chaitra",
  "Vaishakha",
  "Jyeshtha",
  "Ashadha",
  "Shravana",
  "Bhadra",
  "Ashvina",
  "Kartika",
  "Agrahayana",
  "Pausha",
  "Magha",
  "Phalguna",
] as const;

export const INDIAN_MONTH_NAMES_HI = [
  "चैत्र",
  "वैशाख",
  "ज्येष्ठ",
  "आषाढ़",
  "श्रावण",
  "भाद्रपद",
  "अश्विन",
  "कार्तिक",
  "अग्रहायण",
  "पौष",
  "माघ",
  "फाल्गुन",
] as const;
