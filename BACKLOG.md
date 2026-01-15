# HR Portal Backlog

## 🔴 P0 - MVP Blockers

### Jira Integration
**Status:** Not Started  
**Priority:** High  
**Estimate:** 2-3 days

Integration with Jira for onboarding/offboarding workflows:

- [ ] **REQ-P0-JIRA-01:** Integrate with Jira onboarding/offboarding workflows
- [ ] **REQ-P0-JIRA-02:** Trigger actions from Jira events (webhook or polling)
- [ ] **REQ-P0-JIRA-02A:** External emails from Jira → create Pending Access external profile
  - Audit trail with `change_source=jira`
- [ ] **REQ-P0-JIRA-04:** Service account/token with least privilege
  - Secrets in vault/env
  
**Technical Tasks:**
- Create webhook endpoint `/api/webhooks/jira`
- Parse Jira webhook payload
- Map Jira events to onboarding/offboarding actions
- Create/update employee records from Jira
- Handle external user invitations from Jira
- Add audit logging for all Jira-triggered changes
- Configure Jira webhook in Jira admin
- Add environment variables: `JIRA_WEBHOOK_SECRET`, `JIRA_API_TOKEN`

**Files to create:**
- `src/app/api/webhooks/jira/route.ts` - webhook handler
- `src/lib/jira/index.ts` - Jira integration logic
- `src/lib/jira/types.ts` - Jira payload types

**Reference:**
- See existing Google Workspace sync implementation
- Similar pattern to `/api/webhooks/google`

---

## 🟡 P1 - Post-MVP

### Org Chart Visualization
**Status:** Not Started  
**Priority:** Medium  
**Estimate:** 1-2 weeks

Visual organization chart with hierarchical tree view:

- [ ] Interactive org chart component
- [ ] Tree layout algorithm
- [ ] Zoom and pan functionality
- [ ] Search and highlight in org chart
- [ ] Export org chart as image/PDF
- [ ] Mobile-responsive org chart view

**Technical Tasks:**
- Choose visualization library (D3.js, React Flow, or custom)
- Create org chart data transformation
- Implement tree layout algorithm
- Add interactive controls
- Style to match Algonova design system

---

### Availability Tracking
**Status:** Not Started  
**Priority:** Medium  
**Estimate:** 1 week

Track employee availability and time-off:

- [ ] Availability calendar view
- [ ] Mark availability status (available, busy, out of office)
- [ ] Time-off request system
- [ ] Team availability overview
- [ ] Integration with Google Calendar (optional)

**Technical Tasks:**
- Create Availability model in Prisma
- Build calendar UI component
- Add availability API endpoints
- Implement team availability dashboard

---

### Assessments System
**Status:** Not Started  
**Priority:** Low  
**Estimate:** 2-3 weeks

Performance assessment and review system:

- [ ] Assessment templates
- [ ] Review cycles
- [ ] Self-assessment
- [ ] Manager assessment
- [ ] 360-degree feedback
- [ ] Assessment history
- [ ] Goal tracking

**Technical Tasks:**
- Design assessment data model
- Create assessment workflow
- Build assessment forms
- Add approval process
- Generate assessment reports

---

## 🟢 Enhancements & Bug Fixes

### ✅ Completed
- [x] User blocking and deletion functionality
- [x] Failed login attempt logging
- [x] 2FA with TOTP
- [x] Active session management
- [x] Password-based authentication
- [x] Change history display improvements (show names instead of IDs)

---

## 📝 Technical Debt

### Performance Optimization
**Status:** Not Started  
**Priority:** Low

- [ ] Optimize history ID resolution (batch queries instead of N+1)
- [ ] Add caching for frequently accessed data
- [ ] Database query optimization
- [ ] Image optimization for avatars

### Code Quality
**Status:** Not Started  
**Priority:** Low

- [ ] Add TypeScript type annotations (remove `any` types)
- [ ] Unit tests for critical business logic
- [ ] Integration tests for API endpoints
- [ ] E2E tests for key user flows

### Documentation
**Status:** Not Started  
**Priority:** Low

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Component documentation (Storybook)
- [ ] Deployment guide
- [ ] User manual

---

## 🔒 Security

### Future Security Enhancements
**Status:** Not Started  
**Priority:** Medium

- [ ] Rate limiting on authentication endpoints
- [ ] IP whitelisting for admin actions
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Vulnerability scanning (Dependabot, Snyk)
- [ ] Security audit logging for sensitive operations
- [ ] Session timeout configuration
- [ ] Password complexity requirements
- [ ] Account lockout policies

---

## 📊 Analytics & Reporting

### Future Analytics Features
**Status:** Not Started  
**Priority:** Low

- [ ] Employee turnover reports
- [ ] Department growth trends
- [ ] Onboarding completion metrics
- [ ] User activity analytics
- [ ] Export reports to Excel/PDF

---

## 💼 Business Features

### Future Business Features
**Status:** Not Started  
**Priority:** Low (Gated - P2)

- [ ] Compensation & Benefits (CNB) module
- [ ] Salary management
- [ ] Bonus tracking
- [ ] Benefits enrollment
- [ ] FOT (Fondo de Operaciones Totales) tracking

---

## 🐛 Known Issues

### Minor UI Issues
- None currently tracked

### Performance Issues
- History ID resolution causes N+1 queries (needs batch optimization)

---

## 📅 Release Planning

### v1.0 - MVP Release
**Target Date:** TBD  
**Required:** Jira integration completion

### v1.1 - Post-MVP Features
**Target Date:** TBD  
**Includes:** Org chart visualization, availability tracking

### v2.0 - Major Features
**Target Date:** TBD  
**Includes:** Assessments system, CNB module

---

**Last Updated:** January 15, 2026
