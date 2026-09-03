import { ChroneraError } from "../errors/errors.js";
import { instantFromDate } from "../core/instant.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";
import { formatNumberWithSystem } from "../locale/numbering-system.js";

import type {
  FormatDateTimeOptions,
  Instant,
  LocalDateTime,
} from "../public-types.js";

export function formatDateTime(
  input: LocalDateTime | Instant | Date,
  options: Readonly<FormatDateTimeOptions> = {},
): string {
  const localeInfo = validateAndResolveLocale(options.locale);
  const locale = localeInfo.baseLocale;
  const numberingSystem =
    options.numberingSystem ?? localeInfo.unicodeNumberingSystem;
  const dateStyle = options.dateStyle ?? "medium";
  const timeStyle = options.timeStyle ?? "short";
  const calId = options.calendar ?? "gregory";

  let timestamp: number;
  let timeZone = "UTC";

  if ("kind" in input && input.kind === "local-date-time") {
    if (options.timeZone !== undefined) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Timezone option is forbidden for local-date-time inputs.",
      );
    }
    timestamp = Date.UTC(
      input.date.year,
      input.date.month - 1,
      input.date.day,
      input.time.hour,
      input.time.minute,
      input.time.second,
      input.time.millisecond,
    );
  } else {
    let instant: Instant;
    if ("kind" in input && input.kind === "instant") {
      instant = input;
    } else if (input instanceof Date) {
      instant = instantFromDate(input);
    } else {
      throw new ChroneraError(
        "CHRONERA_INVALID_DATE",
        "Expected LocalDateTime, Instant, or Date.",
      );
    }
    timestamp = instant.epochMilliseconds;
    timeZone = options.timeZone ?? "UTC";
  }

  const intlOpts: Intl.DateTimeFormatOptions = {
    dateStyle,
    timeStyle,
    timeZone,
    ...(calId !== "iso8601" ? { calendar: calId } : { calendar: "gregory" }),
    ...(options.hourCycle !== undefined
      ? { hourCycle: options.hourCycle }
      : {}),
    ...(numberingSystem !== undefined ? { numberingSystem } : {}),
  };

  const dtf = new Intl.DateTimeFormat(locale, intlOpts);
  let output = dtf.format(new Date(timestamp));

  if (numberingSystem && numberingSystem !== "latn") {
    output = formatNumberWithSystem(output, numberingSystem);
  }

  return output;
}
