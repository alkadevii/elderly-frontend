import { BASE_URL, handleResponse } from "./api";
import type { Review, ReviewFormData, StaffRating } from "@/types/Review";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

const buildQuery = (params: Record<string, unknown>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      q.append(key, String(value));
    }
  });
  const s = q.toString();
  return s ? `?${s}` : "";
};

export const getReviews = async (params?: { staffId?: string; userId?: string; from?: string; to?: string }) => {
  const response = await fetch(`${BASE_URL}/reviews${buildQuery((params || {}) as Record<string, unknown>)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createReview = async (data: ReviewFormData) => {
  const response = await fetch(`${BASE_URL}/reviews`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const getStaffRating = async (staffId: string) => {
  const response = await fetch(`${BASE_URL}/reviews/rating/${staffId}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};
