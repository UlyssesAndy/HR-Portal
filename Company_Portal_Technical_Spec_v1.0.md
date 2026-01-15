# Company Portal — Technical Specification
**Version:** 1.0  
**Date:** 2026-01-12  
**Status:** Draft  
> **Note:** Vacation Tracker is specified in a separate document and will be integrated later.
## 1. Overview
- Scope: service catalog (home), employee directory, RBAC/admin console, integrations (Google Workspace + Jira + email access policy), scheduled/triggered sync.
- UI language: **English** (MVP).
- Existing portal integration: required (deep link in MVP).

## 2. MVP scope and priorities
| Priority | Included | Notes |
|---|---|---|
| P0 (MVP) | Service catalog, employee directory, RBAC/admin, GW/Jira/email integrations, sync/logs, org structure data model | Mandatory |
| P1 | Org chart visualization, availability, assessments | Post-MVP |
| P2 | CNB (salary/bonuses/FOT) | Gated |

## 3. Integration with the existing portal
- **REQ-P0-PORTAL-01:** Provide integration with the current portal.
  - Minimum: prominent deep link (service card / navigation item).
  - Optional: embed (iframe) or unified navigation.
- **RFC-PORTAL-01:** confirm integration mode and SSO/session expectations.

## 4. Abbreviations
| Abbrev | Meaning |
|---|---|
| AC | Acceptance Criteria |
| API | Application Programming Interface |
| CNB | Compensation & Benefits |
| CSV | Comma-separated values |
| Directory | Corporate directory (Google Workspace Directory) |
| FR | Functional Requirements |
| HRIS | HR system |
| IdP | Identity Provider |
| JIT | Just-in-Time provisioning |
| MVP | Minimum Viable Product |
| NFR | Non-functional requirements |
| PII | Personally identifiable information |
| RBAC | Role-based access control |
| RFC | Clarification needed |
| SoT | Source of Truth |
| SSO | Single Sign-On |

## 5. Roles and RBAC
- Roles: Employee, Manager, HR, Payroll/Finance, Admin.
- **DEC-P0-RBAC-01:** role assignment via Google Groups mapping.
- **REQ-P0-RBAC-02 (optional):** local role overrides for exceptions (audited).

## 6. Home page: service catalog
- **REQ-P0-01:** service cards (title, description, url, category, icon, sort order).
- **REQ-P0-03:** admin CRUD for cards.
- **REQ-P0-04:** model supports visibility constraints by role/group (UI may come later).
- **REQ-P0-05:** model/API ready for adding service search.

## 7. Employee directory
- Target scale: 600+ now, up to 1000 (MVP).
- **REQ-P0-10:** list with pagination/virtualization.
- **REQ-P0-11:** search by name/email/department/position/manager/location/timezone.
- **REQ-P0-12:** filters: department, status, location.
- **REQ-P0-13:** English-first fuzzy search (typos) at least for name/email/department/position.

### 7.1 Profile fields (MVP)
- Full name
- Department (managed list)
- Position (separate field)
- Manager
- Start date
- Birth date (role-configurable; default restricted)
- Location
- Time zone
- Status (leave/maternity/terminated + dates)
- Contacts (corporate email + messenger; phone optional)
- Employment type + legal entity (restricted; configurable)

### 7.2 Change history
- **REQ-P0-30:** history for department/position (manager recommended).
- **REQ-P0-31:** history visibility configurable by role.
- **REQ-P0-32:** HR/Admin can manually correct history (audited).

## 8. Integrations (MVP / P0)
### 8.1 Google Workspace
- **REQ-P0-GW-01:** Google SSO.
- **REQ-P0-GW-02:** Directory sync (users + groups).
- **REQ-P0-GW-03:** role mapping via Groups.
- **REQ-P0-GW-04:** offboarding via suspended/removed; **Sync now** exists.

### 8.2 Email-based access policy (registration)
- **REQ-P0-EMAIL-01:** access granted by email policy (corporate domains + SSO recommended).
- JIT provisioning on first SSO login.
- Invite-only allowlist for external users (optional).
- **REQ-P0-EMAIL-05:** no local passwords in MVP.

### 8.3 Jira
- **REQ-P0-JIRA-01:** integrate with Jira onboarding/offboarding workflows.
- **REQ-P0-JIRA-02:** trigger actions from Jira events.
- **REQ-P0-JIRA-02A:** external emails from Jira -> create Pending Access external profile; audit `change_source=jira`.
- **REQ-P0-JIRA-04:** service account/token with least privilege; secrets in vault.

## 9. Sync, admin console, and audit
- **DEC-P0-SYNC-01:** scheduled sync once per day.
- **REQ-P0-60:** manual **Sync now**.
- **REQ-P0-61:** SyncRun/SyncError logs + problem records.
- **REQ-P0-CSV-01:** CSV import with validation + dry-run + audit.
- **REQ-P0-AUDIT-01:** audit log for admin/HR actions and sensitive access.

## 10. NFR (MVP)
- English UI.
- Responsive list/search up to 1000 employees.
- RBAC enforced server-side.
- Secure secrets handling.
- Backups + monitoring for sync failures.

## 11. RFC list
- RFC-PORTAL-01: existing portal integration mode.
- RFC-GW-01: which extra Workspace attributes are SoT.
- RFC-EMAIL-01: external users needed? invite/IdP.
- RFC-JIRA-01: webhook vs polling vs via n8n; trigger mapping.
- RFC-PII-01: default visibility for birth date/phone/start date/employment.
- RFC-CSV-01: CSV schema and ownership.
