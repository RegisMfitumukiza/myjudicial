/**
 * Tier 3 — Embedding Auto-Sync Service
 *
 * Fires an async (non-blocking) request to the Python AI service to regenerate
 * an expert's profile_embedding whenever:
 *   1. A new expert profile is created (createProfile)
 *   2. An existing expert profile is updated (bio, specialties, etc.)
 *   3. An admin verifies / reactivates an expert (status → VERIFIED)
 *
 * The call is intentionally fire-and-forget: it must NEVER slow down or break
 * the primary API response. The Python AI service will write the embedding
 * directly to the `experts.profile_embedding` column via its own DB connection.
 *
 * This implements the industrial-grade "Tier 3 lifecycle embedding" guarantee:
 * every lawyer automatically becomes AI-searchable as soon as their profile
 * changes, without any manual admin script or cron job.
 */

import { logger } from "../../shared/utils/logger.js";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL ?? "http://localhost:5000";
const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY ?? "";

/**
 * Triggers embedding regeneration for a single expert in the AI service.
 *
 * @param expertId  The UUID of the ExpertProfile row in the `experts` table.
 * @param reason    A short string describing why this was triggered (for logs).
 */
export async function triggerEmbeddingSync(
  expertId: string,
  reason: "profile_created" | "profile_updated" | "expert_verified" | "manual"
): Promise<void> {
  // Fire-and-forget: never await this in the caller
  setImmediate(async () => {
    const url = `${AI_SERVICE_URL}/api/v1/search/embeddings/generate`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (AI_SERVICE_KEY) {
      headers["X-API-Key"] = AI_SERVICE_KEY;
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          expert_ids: [expertId],
          force_regenerate: true, // Always regenerate — profile content changed
        }),
        signal: AbortSignal.timeout(30_000), // 30s max — don't hang forever
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "(unreadable)");
        logger.warn(
          `[EmbeddingSync] AI service returned ${response.status} for expert ${expertId} (reason: ${reason}): ${body}`
        );
        return;
      }

      const data = await response.json().catch(() => ({}));
      logger.info(
        `[EmbeddingSync] Embedding triggered for expert ${expertId} (reason: ${reason}) — ` +
        `generated=${data?.embeddings_generated ?? "?"}, skipped=${data?.embeddings_skipped ?? "?"}`
      );
    } catch (err: any) {
      // Catch everything — a failed embedding sync must never surface to the user
      if (err?.name === "TimeoutError") {
        logger.warn(
          `[EmbeddingSync] Timeout triggering embedding for expert ${expertId} (reason: ${reason})`
        );
      } else {
        logger.warn(
          `[EmbeddingSync] Failed to trigger embedding for expert ${expertId} (reason: ${reason}): ${err?.message}`
        );
      }
    }
  });
}
