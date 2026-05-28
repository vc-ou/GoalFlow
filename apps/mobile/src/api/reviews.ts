import { http } from "./http";
import type { ApiReview } from "./types";

export function fetchReviews(planId?: string) {
  const query = planId ? `?plan_id=${encodeURIComponent(planId)}` : "";
  return http<ApiReview[]>(`/reviews${query}`);
}

export function createReview(payload: {
  plan_id: string | null;
  gains: string;
  problems: string;
  ideas: string;
  next_actions: string;
}) {
  return http<ApiReview>("/reviews", {
    method: "POST",
    data: payload
  });
}

export function updateReview(
  reviewId: string,
  payload: {
    plan_id: string | null;
    gains: string;
    problems: string;
    ideas: string;
    next_actions: string;
  }
) {
  return http<ApiReview>(`/reviews/${reviewId}`, {
    method: "PUT",
    data: payload
  });
}

export function deleteReview(reviewId: string) {
  return http<{ success: boolean }>(`/reviews/${reviewId}`, {
    method: "DELETE"
  });
}
