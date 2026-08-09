# Security Checklist

# Security Checklist

## Purpose

Ensure every feature meets the minimum security requirements before deployment.

---

# Authentication

- [ ] Authentication enforced where required.
- [ ] JWT/session validation verified.
- [ ] Expiration handled correctly.

---

# Authorization

- [ ] RBAC enforced.
- [ ] Ownership validated.
- [ ] Admin-only routes protected.

---

# Validation

- [ ] All user input validated.
- [ ] File uploads validated.
- [ ] Invalid data rejected.

---

# Sensitive Data

- [ ] Passwords never exposed.
- [ ] Tokens never exposed.
- [ ] Internal IDs protected where appropriate.
- [ ] Private documents protected.

---

# API Security

- [ ] Rate limiting implemented where necessary.
- [ ] CORS reviewed.
- [ ] Secure headers configured.

---

# Database

- [ ] Parameterized queries used.
- [ ] ORM protections respected.
- [ ] No raw SQL unless justified.

---

# Logging

- [ ] Security events logged.
- [ ] Failed authentication logged.
- [ ] Sensitive information never logged.

---

# File Uploads

- [ ] File type validated.
- [ ] File size limited.
- [ ] Malware scanning considered.
- [ ] Storage permissions verified.

---

# Final Review

- [ ] No known security issues remain.
- [ ] Feature reviewed against OWASP Top 10 where applicable.