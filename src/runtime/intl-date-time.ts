import { BoundedLRU } from "./bounded-lru.js";
import { ChroneraError } from "../errors/errors.js";

export interface CachedDateTimeFormatOptions
  extends Intl.DateTimeFormatOptions {
  locale?: string;
}

export class IntlDateTimeService {
  private readonly cache: BoundedLRU<Intl.DateTimeFormat>;

  constructor(cacheSize: number = 64) {
    this.cache = new BoundedLRU<Intl.DateTimeFormat>(cacheSize);
  }

  getFormatter(
    locale: string,
    options: Intl.DateTimeFormatOptions = {},
  ): Intl.DateTimeFormat {
    const key = this.createKey(locale, options);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    try {
      const formatter = new Intl.DateTimeFormat(locale, options);
      this.cache.set(key, formatter);
      return formatter;
    } catch (err) {
      throw new ChroneraError(
        "CHRONERA_INCOMPATIBLE_OPTION",
        `Failed to create DateTimeFormat for locale "${locale}": ${err instanceof Error ? err.message : String(err)}`,
        { cause: err },
      );
    }
  }

  private createKey(
    locale: string,
    options: Intl.DateTimeFormatOptions,
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

  get cacheSize(): number {
    return this.cache.size;
  }
}
