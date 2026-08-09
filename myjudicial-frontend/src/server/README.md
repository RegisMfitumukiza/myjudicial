# Server Code

This directory is the backend of the fullstack Next.js app.

- `db/`: Prisma client and database access.
- `auth/`: Auth.js integration, email OTP helpers, password hashing for admin fallback, and guards.
- `modules/`: domain modules such as auth, users, experts, bookings, verification, payments, and documents.
- `services/`: provider adapters for Redis, queues, LiveKit, storage, payments, SMS, and email.
- `security/`: audit logs, rate limiting, and security helpers.
- `http/`: request context, API versioning, route wrappers, and normalized error responses.

Route handlers in `src/app/api` should stay thin and call these modules through `withApiHandler` unless they must preserve Auth.js redirect behavior.
