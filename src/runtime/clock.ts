/**
 * System Clock Provider with mocking and time-freezing support.
 * @internal
 */
let mockNowEpoch: number | null = null;

/**
 * Returns current timestamp in epoch milliseconds, respecting any active mock time.
 */
export function getNowEpoch(): number {
  return mockNowEpoch ?? Date.now();
}

/**
 * Returns current JavaScript Date, respecting any active mock time.
 */
export function getNowDate(): Date {
  return new Date(getNowEpoch());
}

/**
 * Overrides or clears the system time epoch milliseconds.
 * Pass `null` to restore the real system clock.
 */
export function setSystemTimeEpoch(epochMs: number | null): void {
  mockNowEpoch = epochMs;
}

/**
 * Advances the active mock clock by the specified milliseconds.
 */
export function advanceSystemTimeEpoch(ms: number): void {
  mockNowEpoch = (mockNowEpoch ?? Date.now()) + ms;
}

/**
 * Returns true if system time is currently mocked.
 */
export function isSystemTimeMocked(): boolean {
  return mockNowEpoch !== null;
}
