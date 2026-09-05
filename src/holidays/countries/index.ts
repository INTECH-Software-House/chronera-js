import { thailandHolidays } from "./th.js";
import { japanHolidays } from "./jp.js";
import { saudiArabiaHolidays } from "./sa.js";
import { uaeHolidays } from "./ae.js";
import { iranHolidays } from "./ir.js";
import { taiwanHolidays } from "./tw.js";
import { indiaHolidays } from "./in.js";
import { singaporeHolidays } from "./sg.js";
import { unitedStatesHolidays } from "./us.js";
import { unitedKingdomHolidays } from "./gb.js";
import { germanyHolidays } from "./de.js";
import { franceHolidays } from "./fr.js";
import { australiaHolidays } from "./au.js";
import { chinaHolidays } from "./cn.js";
import { hongKongHolidays } from "./hk.js";

import type { CountryCode, HolidayCalendar } from "../types.js";

export const BUILT_IN_HOLIDAYS: Record<CountryCode, HolidayCalendar> = {
  TH: thailandHolidays,
  JP: japanHolidays,
  SA: saudiArabiaHolidays,
  AE: uaeHolidays,
  IR: iranHolidays,
  TW: taiwanHolidays,
  IN: indiaHolidays,
  SG: singaporeHolidays,
  US: unitedStatesHolidays,
  GB: unitedKingdomHolidays,
  DE: germanyHolidays,
  FR: franceHolidays,
  AU: australiaHolidays,
  CN: chinaHolidays,
  HK: hongKongHolidays,
};

export {
  thailandHolidays,
  japanHolidays,
  saudiArabiaHolidays,
  uaeHolidays,
  iranHolidays,
  taiwanHolidays,
  indiaHolidays,
  singaporeHolidays,
  unitedStatesHolidays,
  unitedKingdomHolidays,
  germanyHolidays,
  franceHolidays,
  australiaHolidays,
  chinaHolidays,
  hongKongHolidays,
};
