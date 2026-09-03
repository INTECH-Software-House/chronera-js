## Description

<!-- Provide a concise summary of the changes introduced in this pull request -->

## Type of Change

- [ ] `feat`: A new feature or capability
- [ ] `fix`: A bug fix
- [ ] `perf`: A code change that improves performance
- [ ] `refactor`: A code change that neither fixes a bug nor adds a feature
- [ ] `test`: Adding missing tests or correcting existing tests
- [ ] `build`: Changes that affect the build system or external dependencies
- [ ] `ci`: Changes to our CI configuration files and scripts
- [ ] `docs`: Documentation only changes
- [ ] `chore`: Miscellaneous housekeeping tasks

## Enterprise Quality & Clean Architecture Checklist

- [ ] **Clean Architecture Boundaries**: Core domain entities and algorithms have zero dependencies on outer adapters, formatters, or runtimes (`pnpm check:architecture` passes).
- [ ] **Strict Typing**: Zero `any` types, zero `as` assertions without documented invariants (`pnpm typecheck` passes).
- [ ] **Zero Runtime Dependencies**: No runtime dependencies added to `package.json`.
- [ ] **Test Coverage**: Test coverage satisfies all required thresholds (`pnpm test:coverage`):
  - Statements: $\ge 90\%$
  - Branches: $\ge 85\%$
  - Functions: $\ge 90\%$
  - Lines: $\ge 90\%$
- [ ] **Multi-Package Manager Compatibility**: Consumer verification passes across `npm`, `pnpm`, `yarn`, and `bun` (`pnpm pack:check`).
- [ ] **Linting & Code Style**: Prettier formatting and ESLint rules verified (`pnpm format:check && pnpm lint`).
- [ ] **Security & CODEOWNERS**: Reviewed and authorized by repository code owner (`@ParkPawapon`).
