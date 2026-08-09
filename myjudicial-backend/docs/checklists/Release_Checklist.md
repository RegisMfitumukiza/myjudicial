# Release Checklist

# Release Checklist

## Purpose

This checklist must be completed before deploying a new release to production.

---

# Build

- [ ] TypeScript compiles.
- [ ] Lint passes.
- [ ] Build succeeds.

---

# Database

- [ ] Migrations reviewed.
- [ ] Backup completed.
- [ ] Rollback plan documented.

---

# Environment

- [ ] Environment variables verified.
- [ ] Secrets configured.
- [ ] Third-party credentials verified.

---

# Testing

- [ ] Critical workflows tested.
- [ ] Authentication tested.
- [ ] Payments tested.
- [ ] Notifications tested.

---

# Infrastructure

- [ ] Docker images built.
- [ ] Redis available.
- [ ] Background workers running.
- [ ] Storage verified.

---

# Monitoring

- [ ] Logging enabled.
- [ ] Error monitoring configured.
- [ ] Health checks working.

---

# Documentation

- [ ] Roadmap updated.
- [ ] Audit report updated if necessary.
- [ ] ADRs updated if architectural decisions changed.

---

# Deployment

- [ ] Deployment successful.
- [ ] Smoke tests completed.
- [ ] Production verified.

---

## Release Approval

- [ ] Ready for Production