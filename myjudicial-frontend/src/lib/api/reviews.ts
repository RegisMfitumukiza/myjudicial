import { apiFetch } from "./client";

export interface ExpertReply {
  id: string;
  reviewId: string;
  expertId: string;
  reply: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string | null;
  expert: { id: string; displayName: string };
}

export interface ReviewReport {
  id: string;
  reviewId: string;
  reportedBy: string;
  reason: string;
  details?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ReviewWithExtras {
  id: string;
  bookingId: string;
  citizenId: string;
  expertId: string;
  rating: number;
  title?: string;
  comment?: string;
  status: string;
  helpfulCount: number;
  unhelpfulCount: number;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string };
  expertReply?: ExpertReply | null;
}

interface BackendResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Expert replies to a review */
export async function postReviewReply(reviewId: string, reply: string) {
  const res = await apiFetch<BackendResponse<ExpertReply>>(
    `/reviews/${reviewId}/reply`,
    { method: "POST", body: { reply } }
  );
  return res.data;
}

/** Expert edits their reply */
export async function patchReviewReply(reviewId: string, reply: string) {
  const res = await apiFetch<BackendResponse<ExpertReply>>(
    `/reviews/${reviewId}/reply`,
    { method: "PATCH", body: { reply } }
  );
  return res.data;
}

/** Expert deletes their reply */
export async function deleteReviewReply(reviewId: string) {
  await apiFetch(`/reviews/${reviewId}/reply`, { method: "DELETE" });
}

/** Toggle helpful/unhelpful reaction */
export async function postReviewReaction(reviewId: string, isHelpful: boolean) {
  await apiFetch(`/reviews/${reviewId}/react`, {
    method: "POST",
    body: { isHelpful },
  });
}

/** Remove reaction from a review */
export async function deleteReviewReaction(reviewId: string) {
  await apiFetch(`/reviews/${reviewId}/react`, { method: "DELETE" });
}

/** Report a review */
export async function postReviewReport(
  reviewId: string,
  reason: string,
  details?: string
) {
  const res = await apiFetch<BackendResponse<ReviewReport>>(
    `/reviews/${reviewId}/report`,
    { method: "POST", body: { reason, details } }
  );
  return res.data;
}
