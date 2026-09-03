import { CalendarRegistry } from "../calendar/registry.js";
import { IntlDateTimeService } from "../runtime/intl-date-time.js";

import type { ChroneraConfig } from "../public-types.js";

export class ChroneraEngine {
  readonly registry: CalendarRegistry;
  readonly intl: IntlDateTimeService;

  constructor(config?: Readonly<ChroneraConfig>) {
    this.registry = new CalendarRegistry(config?.calendars);
    this.intl = new IntlDateTimeService(config?.formatterCacheSize ?? 64);
  }
}
