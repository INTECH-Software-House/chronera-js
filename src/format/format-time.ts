import { ChroneraError } from "../errors/errors.js";
import { instantFromDate } from "../core/instant.js";
import { validateAndResolveLocale } from "../locale/resolve-locale.js";
import { formatNumberWithSystem } from "../locale/numbering-system.js";

import type { FormatTimeOptions, Instant, LocalTime } from "../public-types.js";

export function formatTime(
  input: LocalTime | Instant | Date,
  options: Readonly<FormatTimeOptions> = {},
): string {
  const localeInfo = validateAndResolveLocale(options.locale);
  const locale = localeInfo.baseLocale;
  const numberingSystem =
    options.numberingSystem ?? localeInfo.unicodeNumberingSystem;
  const style = options.style ?? "short";

  let timestamp: number;
  let timeZone = "UTC";

  if ("kind" in input && input.kind === "local-time") {
    if (options.timeZone !== undefined) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        "Timezone option is forbidden for local-time inputs.",
      );
    }
    // Anchor to arbitrary UTC date
    timestamp = Date.UTC(
      1970,
      0,
      1,
      input.hour,
      input.minute,
      input.second,
      input.millisecond,
    );
  } else {
    let instant: Instant;
    if ("kind" in input && input.kind === "instant") {
      instant = input;
    } else if (input instanceof Date) {
      instant = instantFromDate(input);
    } else {
      throw new ChroneraError(
        "CHRONERA_INVALID_TIME",
        "Expected LocalTime, Instant, or Date.",
      );
    }
    timestamp = instant.epochMilliseconds;
    timeZone = options.timeZone ?? "UTC";
  }

  const intlOpts: Intl.DateTimeFormatOptions = {
    timeStyle: style,
    timeZone,
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
