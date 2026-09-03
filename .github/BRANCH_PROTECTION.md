# Enterprise Branch Protection & Governance Specification

This document specifies the required GitHub repository branch protection rulesets to enforce maximum production security for `main`.

---

## 1. Primary Branch: `main`

### Protection Rules

In **GitHub Repository Settings -> Rules -> Rulesets -> New branch ruleset**:

- **Ruleset Name**: `Enterprise Production Protection`
- **Enforcement Status**: `Active`
- **Target Branches**: Include default branch (`main`)

### Bypass List (Exclusive Authority)

- **Bypass Mode**: `Always allow`
- **Authorized User**:
  - `@ParkPawapon` (Pawapon Thammalangka)
- _No other users, roles, teams, or automated bots are granted bypass permissions._

---

## 2. Mandatory Pull Request Protections

- [x] **Require a pull request before merging**:
  - **Required approvals**: `1`
  - [x] **Dismiss stale pull request approvals when new commits are pushed**
  - [x] **Require review from Code Owners** (Enforces `.github/CODEOWNERS` sign-off by `@ParkPawapon`)
  - [x] **Require approval of the most recent reviewable push**
  - [x] **Require conversation resolution before merging**

---

## 3. Required Status Checks (CI/CD Gates)

All required status checks must pass before merging is permitted:

1. `Validate on Node 22.14.0` (`CI / validate`)
2. `Validate on Node 24` (`CI / validate`)
3. `Packed package consumers` (`CI / package-consumers` verifying npm, pnpm, yarn, bun)
4. `CodeQL Semantic Analysis` (`Security Analysis / codeql`)
5. `Dependency Vulnerability Audit` (`Security Analysis / audit`)

- [x] **Require branches to be up to date before merging**

---

## 4. Integrity and Cryptographic Constraints

- [x] **Require signed commits** (GPG / SSH commit signing)
- [x] **Require linear history** (Prevent merge skew; preserve clear rebase/squash progression)
- [x] **Block force pushes** (Bypassable only by `@ParkPawapon` in documented emergency recovery)
- [x] **Block deletions** (Default branch deletion is prohibited)

---

## 5. Security & Vulnerability Defense Checklist

- **CodeQL Engine**: Analyzes AST for prototype pollution, ReDoS, and untrusted inputs on push and PR.
- **Dependency Audit**: Runs `pnpm audit --audit-level=high` in CI pipeline.
- **Secret Scanning**: GitHub Push Protection prevents accidental secret or token leakage.
- **Private Reporting**: All vulnerabilities are triaged privately via GitHub Security Advisories before disclosure.
