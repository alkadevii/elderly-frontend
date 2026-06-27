import { BASE_URL, handleResponse } from "./api";
import type { Vital, VitalFormData, VitalTrends, VitalType } from "@/types/Vital";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export type VitalListQuery = {
  userId?: string;
  type?: VitalType;
  from?: string;
  to?: string;
  limit?: number;
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

export const getVitals = async (query: VitalListQuery = {}) => {
  const response = await fetch(`${BASE_URL}/vitals${buildQuery(query)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response) as Promise<Vital[]>;
};

export const createVital = async (data: VitalFormData) => {
  const response = await fetch(`${BASE_URL}/vitals`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const getVitalTrends = async (query: { userId?: string; type?: VitalType; from?: string; to?: string } = {}) => {
  const response = await fetch(`${BASE_URL}/vitals/trends${buildQuery(query)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response) as Promise<VitalTrends>;
};

export const deleteVital = async (id: string) => {
  const response = await fetch(`${BASE_URL}/vitals/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};

function formatRangeDisplay(range: Record<string, unknown>): string {
  const sMin = range.systolicMin as number | undefined;
  const sMax = range.systolicMax as number | undefined;
  const dMin = range.diastolicMin as number | undefined;
  const dMax = range.diastolicMax as number | undefined;
  const min = range.min as number | undefined;
  const max = range.max as number | undefined;

  if (sMin !== undefined || sMax !== undefined || dMin !== undefined || dMax !== undefined) {
    const s = sMin !== undefined ? `≥ ${sMin}` : sMax !== undefined ? `≤ ${sMax}` : "--";
    const d = dMin !== undefined ? `≥ ${dMin}` : dMax !== undefined ? `≤ ${dMax}` : "--";
    return `${s} / ${d}`;
  }
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `≥ ${min}`;
  if (max !== undefined) return `≤ ${max}`;
  return "--";
}

export const getVitalRanges = async () => {
  const response = await fetch(`${BASE_URL}/vitals/ranges`, {
    headers: getHeaders(),
  });
  const data = await handleResponse(response);
  // API returns an object keyed by vital type, convert to array with display strings
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return Object.entries(data)
      .filter(([, value]) => {
        const entry = value as { ranges?: unknown[] };
        return (entry.ranges || []).length > 0;
      })
      .map(([type, value]) => {
        const entry = value as { unit?: string; ranges?: Record<string, unknown>[] };
        return {
          type,
          unit: entry.unit || "",
          ranges: (entry.ranges || []).map((r) => ({
            ...r,
            display: formatRangeDisplay(r),
          })),
        };
      });
  }
  return data;
};