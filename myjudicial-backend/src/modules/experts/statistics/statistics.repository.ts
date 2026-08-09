/**
 * Statistics are computed dynamically in statistics.service.ts
 * using direct Prisma queries across Booking and Review tables.
 * No separate repository layer is needed — the data is read-only
 * and spans multiple models without mutation logic.
 */
