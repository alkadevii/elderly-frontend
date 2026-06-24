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

export const getVitalRanges = async () => {
  const response = await fetch(`${BASE_URL}/vitals/ranges`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};