# Support Policy

This document describes support channels, version lifecycles, and service level objectives for `@intech-software/chronera`.

---

## 1. Community & Open Source Support

- **Bug Reports & Issues**: If you encounter an unexpected error, reproducible bug, or type mismatch, please open a report via [GitHub Issues](https://github.com/INTECH-Software-House/chronera-js/issues).
- **Feature Requests**: To propose a new national calendar system, astronomical formula, or LDML formatting preset, use our [Feature Request Template](https://github.com/INTECH-Software-House/chronera-js/issues/new?template=feature_request.yml).
- **Security Vulnerabilities**: **DO NOT** report security vulnerabilities in public issues. Submit them confidentially via [GitHub Security Advisories](https://github.com/INTECH-Software-House/chronera-js/security/advisories/new) or contact the maintainer directly at `108130529+ParkPawapon@users.noreply.github.com`.

---

## 2. Release & Version Lifecycle

| Version     | Status                | Node.js Runtime Support                        | Maintenance Window                         |
| :---------- | :-------------------- | :--------------------------------------------- | :----------------------------------------- |
| **0.1.x**   | **Current Active**    | Node 22 LTS, Node 24 LTS, Bun, Modern Browsers | Active feature releases & security patches |
| **< 0.1.0** | **End of Life (EOL)** | None                                           | Unsupported                                |

---

## 3. Service Level Agreements (SLA)

| Request Type                        | Target Response Time | Action                                                          |
| :---------------------------------- | :------------------- | :-------------------------------------------------------------- |
| **Critical Security Vulnerability** | $< 24\text{ hours}$  | Immediate triage, CVSS scoring, and private patch coordination. |
| **Production Blocking Bug**         | $< 48\text{ hours}$  | Reproduction and hotfix assessment.                             |
| **General Issues & Discussions**    | 3-5 business days    | Community review and triage.                                    |
