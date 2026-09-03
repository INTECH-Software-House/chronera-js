import { BoundedLRU } from "./bounded-lru.js";
import { ChroneraError } from "../errors/errors.js";

export class IntlRelativeTimeService {
  private readonly cache: BoundedLRU<Intl.RelativeTimeFormat>;

  constructor(cacheSize: number = 64) {
    this.cache = new BoundedLRU<Intl.RelativeTimeFormat>(cacheSize);
  }

  getFormatter(
    locale: string,
    options: Intl.RelativeTimeFormatOptions = {},
  ): Intl.RelativeTimeFormat {
    const key = this.createKey(locale, options);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const formatter = new Intl.RelativeTimeFormat(locale, options);
      this.cache.set(key, formatter);
      return formatter;
    } catch (err) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        `Failed to create RelativeTimeFormat for locale "${locale}": ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  }

  private createKey(
    locale: string,
    options: Intl.RelativeTimeFormatOptions,
  ): string {
    const keys = Object.keys(options).sort();
    let optsStr = "";
    for (const k of keys) {
      optsStr += `${k}:${String((options as Record<string, unknown>)[k])};`;
    }
    return `${locale}|${optsStr}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
