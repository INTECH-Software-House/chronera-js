export interface JsonSchemaOptions {
  readonly title?: string;
  readonly description?: string;
}

export type ChroneraJsonSchemaType =
  "date" | "date-time" | "time" | "duration" | "instant";

/**
 * Generates an OpenAPI 3.0/3.1 and JSON Schema Draft-07/2020-12 compliant schema definition
 * for Chronera date, time, timestamp, and duration types.
 */
export function chroneraToJsonSchema(
  type: ChroneraJsonSchemaType,
  options: JsonSchemaOptions = {},
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    type: "string",
  };

  if (options.title) {
    base.title = options.title;
  }

  switch (type) {
    case "date":
      base.format = "date";
      base.pattern = "^\\d{4}-\\d{2}-\\d{2}$";
      base.description =
        options.description ??
        "ISO 8601 calendar date representation (YYYY-MM-DD).";
      base.example = "2026-10-17";
      break;

    case "date-time":
    case "instant":
      base.format = "date-time";
      base.pattern =
        "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(?:\\.\\d+)?(?:Z|[+-]\\d{2}:\\d{2})?$";
      base.description =
        options.description ??
        "ISO 8601 / RFC 3339 extended date-time representation.";
      base.example = "2026-10-17T20:54:32.000Z";
      break;

    case "time":
      base.format = "time";
      base.pattern = "^\\d{2}:\\d{2}(?::\\d{2}(?:\\.\\d+)?)?$";
      base.description =
        options.description ??
        "ISO 8601 partial time representation (HH:mm:ss).";
      base.example = "08:30:00";
      break;

    case "duration":
      base.format = "duration";
      base.pattern =
        "^P(?:\\d+Y)?(?:\\d+M)?(?:\\d+W)?(?:\\d+D)?(?:T(?:\\d+H)?(?:\\d+M)?(?:\\d+(?:\\.\\d+)?S)?)?$";
      base.description =
        options.description ??
        "ISO 8601 duration representation (e.g. P1Y2M3DT4H).";
      base.example = "P1Y2M15DT4H30M";
      break;
  }

  return base;
}
