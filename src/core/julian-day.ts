/**
 * International Astronomical Union (IAU) / NASA standard conversions
 * for Julian Day Number (JDN) and Modified Julian Day (MJD).
 *
 * Benchmark reference points:
 * - 1970-01-01 (Absolute Day 0) = JDN 2440588, MJD 40587
 * - 2000-01-01 (J2000.0 Epoch)  = JDN 2451545, MJD 51544
 */

export const JDN_EPOCH_OFFSET = 2440588;
export const MJD_EPOCH_OFFSET = 40587;

/**
 * Converts a Howard Hinnant absolute civil day to an astronomical Julian Day Number (JDN).
 */
export function toJulianDayNumber(absoluteDay: number): number {
  return absoluteDay + JDN_EPOCH_OFFSET;
}

/**
 * Converts an astronomical Julian Day Number (JDN) to a Howard Hinnant absolute civil day.
 */
export function fromJulianDayNumber(jdn: number): number {
  return jdn - JDN_EPOCH_OFFSET;
}

/**
 * Converts a Howard Hinnant absolute civil day to a Modified Julian Day (MJD).
 */
export function toModifiedJulianDay(absoluteDay: number): number {
  return absoluteDay + MJD_EPOCH_OFFSET;
}

/**
 * Converts a Modified Julian Day (MJD) to a Howard Hinnant absolute civil day.
 */
export function fromModifiedJulianDay(mjd: number): number {
  return mjd - MJD_EPOCH_OFFSET;
}
