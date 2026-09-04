# Contributing to Chronera

First off, thank you for considering contributing to Chronera! As an enterprise-grade infrastructure library, Chronera enforces strict architectural boundaries, cryptographic safety, and rigorous verification gates.

---

## 1. Code of Conduct

All contributors and maintainers are expected to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md). Please report any unacceptable behavior to `108130529+ParkPawapon@users.noreply.github.com`.

---

## 2. Architectural Boundaries (Strict Normative Contract)

Chronera is built strictly according to **Clean Architecture** principles. Pull requests that violate these boundaries will be rejected by our automated static analyzer (`scripts/check-architecture.ts`):

```
+-------------------------------------------------------------+
| Frameworks / Outer Adapters (Runtime Intl, Platform APIs)   |
|   +-----------------------------------------------------+   |
|   | Interface Adapters (Calendars, Formatters, Parsers) |   |
|   |   +---------------------------------------------+   |   |
|   |   | Operations (Arithmetic, Comparison, Convert)|   |   |
|   |   |   +-------------------------------------+   |   |   |
|   |   |   | Core Domain Entities & Primitives   |   |   |   |
|   |   |   +-------------------------------------+   |   |   |
|   |   +---------------------------------------------+   |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

1. **Zero Runtime Dependencies**: The package contains exactly zero external runtime dependencies (`dependencies: {}`). No PR adding runtime dependencies will be accepted.
2. **Core Domain Purity**: Modules inside `src/core/` and `src/errors/` MUST NEVER import from outer layers (`src/operations/`, `src/calendar/`, `src/format/`, `src/parse/`, `src/runtime/`).
3. **No Dynamic Monkey-Patching**: Never mutate global objects (`Date.prototype`, `Intl`, `Object`, `Array`).

---

## 3. Development Workflow

### Prerequisites

- **Node.js**: `>= 22.14.0` (Active LTS) or `>= 24.0.0`
- **pnpm**: `>= 11.25.0`
- **Git**: Configured for LF line endings (`git config core.autocrlf false`)

### Setup

```bash
git clone https://github.com/INTECH-Software-House/chronera-js.git
cd chronera-js
pnpm install
```

### Essential Commands

| Command              | Description                                                                   |
| :------------------- | :---------------------------------------------------------------------------- |
| `pnpm build`         | Compiles TypeScript source to `dist/`                                         |
| `pnpm check`         | Runs full local CI suite (format, lint, architecture, types, tests, pack)     |
| `pnpm test`          | Runs 55+ Vitest suites (unit, conformance, round-trip)                        |
| `pnpm test:coverage` | Enforces statement/line coverage $\ge 90\%$, branch coverage $\ge 85\%$       |
| `pnpm test:types`    | Runs TSTyche type-level assertions against public declarations                |
| `pnpm pack:check`    | Validates packed tarball and installs across `npm`, `pnpm`, `yarn`, and `bun` |
| `pnpm release:check` | Executes the complete release gate verification pipeline                      |

---

## 4. Branching & Commit Conventions

### Branch Naming

Branches MUST use lowercase conventional prefixes:

- `feat/<feature-name>`: New functionality
- `fix/<bug-name>`: Bug fixes
- `perf/<optimization>`: Performance improvements
- `refactor/<scope>`: Code refactoring
- `docs/<subject>`: Documentation changes
- `chore/<task>`: Tooling, dependencies, or configuration

_Do NOT use AI-generated or arbitrary branch prefixes._

### Commit Messages

We adhere strictly to [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<optional scope>): <description>

[optional body]

[optional footer(s)]
```

Examples:

- `feat(calendar): add official Ethiopian civil calendar adapter`
- `fix(parse): resolve boundary condition for leap year day-of-year`
- `chore(deps): bump @types/node from 22.20.1 to 26.4.0`

---

## 5. Security & CODEOWNERS Approval

- All Pull Requests require explicit sign-off from the repository code owner (`@ParkPawapon`) via `.github/CODEOWNERS`.
- All commits must be cryptographically signed (GPG / SSH).
- All status checks in GitHub Actions (`CI` and `Security Analysis`) must pass with green status before merging is allowed.
