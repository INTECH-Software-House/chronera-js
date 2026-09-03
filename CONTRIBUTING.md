# Contributing to Chronera

We welcome contributions to Chronera. Please read the governing architecture specification in `README.md` before proposing changes.

## Development Workflow

1. Fork and clone the repository.
2. Ensure you are using Node.js `>=22.14.0` and pnpm.
3. Install dependencies:
   ```bash
   pnpm install --frozen-lockfile
   ```
4. Run essential validation:
   ```bash
   pnpm check
   ```

## Contribution Rules

- Maintain zero runtime dependencies.
- Never use `eval` or `new Function`.
- Never mutate caller-owned objects or `Date` instances.
- Maintain separation between calendars, eras, locales, numbering systems, and timezones.
- Add tests for all new behavior and fixtures for calendar conversions.
- Include a Changeset for observable changes using `pnpm changeset`.
