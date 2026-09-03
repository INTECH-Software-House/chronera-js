# Security Policy

## Supported Versions

Security updates and critical vulnerability fixes are actively provided for the following releases:

| Version | Supported          | Status            |
| ------- | ------------------ | ----------------- |
| 0.1.x   | :white_check_mark: | Current Active    |
| < 0.1.0 | :x:                | End of Life (pre) |

---

## Supply Chain & Architecture Guarantees

Chronera (`@intech/chronera`) is engineered for mission-critical enterprise environments with strict security constraints:

1. **Zero Runtime Dependencies**:
   The production package contains exactly zero third-party runtime dependencies (`"dependencies": {}`). There is no transitive runtime attack surface or prototype pollution vector introduced by external packages.

2. **Immutable & Side-Effect Free**:
   All core value types are strictly frozen or structural, with `sideEffects: false` declared in `package.json`. No global prototypes (`Date`, `Object`, `Array`, `Intl`) are ever monkey-patched or mutated.

3. **Signed npm Provenance**:
   Official releases are published using GitHub Actions OIDC Trusted Publishing with cryptographic build provenance (SLSA Level 3 attestations).

4. **Cryptographic Checksums**:
   Every packaged release tarball is checksummed with SHA-256 before release gates pass.

---

## Reporting a Vulnerability

We treat all security issues with the highest priority. If you identify a potential vulnerability, please report it through private channels:

### Primary Channel: GitHub Private Vulnerability Reporting

Please submit reports via [GitHub Security Advisories](https://github.com/INTECH-Software-House/chronera-js/security/advisories/new). This ensures the issue is kept strictly private while the patch is coordinated.

### Secondary Channel: Direct Security Contact

If you cannot use GitHub Security Advisories, contact the repository owner directly:

- **Security Lead**: Pawapon Thammalangka (`@ParkPawapon`)
- **Email**: `108130529+ParkPawapon@users.noreply.github.com`

---

## Response Timelines & Service Levels (SLA)

| Phase                   | Target Timeline                                 | Details                                                           |
| :---------------------- | :---------------------------------------------- | :---------------------------------------------------------------- |
| **Acknowledgement**     | **Within 24 hours**                             | Confirmation of receipt and assignment of a security tracking ID. |
| **Triage & Assessment** | **Within 48 hours**                             | Reproduction, severity scoring (CVSS v3.1), and impact analysis.  |
| **Mitigation & Patch**  | **Within 7 business days**                      | Implementation of fix, unit tests, and validation on staging.     |
| **Public Disclosure**   | **Coordinated (typically 30 days after patch)** | Coordinated release of security advisory and CVE assignment.      |

---

## Reporting Guidelines

To help us investigate and remediate promptly, please include:

- Affected version(s) of `@intech/chronera`;
- Runtime environment (Node.js version, browser, OS);
- Proof-of-concept (PoC) or minimal reproduction code snippet;
- Potential security impact (e.g. ReDoS, memory consumption, unhandled exception);
- Any suggested remediations or workarounds.
