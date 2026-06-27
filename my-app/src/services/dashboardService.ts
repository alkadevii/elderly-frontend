import { BASE_URL, handleResponse } from "./api";

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

export type DashboardQuery = {
  userId?: string;
  from?: string;
  to?: string;
};

export const getAppointmentAdherence = async (query: DashboardQuery = {}) => {
  const response = await fetch(`${BASE_URL}/dashboard/appointment-adherence${buildQuery(query as Record<string, unknown>)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getVitalAnomalies = async (query: DashboardQuery = {}) => {
  const response = await fetch(`${BASE_URL}/dashboard/vital-anomalies${buildQuery(query as Record<string, unknown>)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getMedicationCompliance = async (query: DashboardQuery = {}) => {
  const response = await fetch(`${BASE_URL}/dashboard/medication-compliance${buildQuery(query as Record<string, unknown>)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getDashboardSummary = async (query: DashboardQuery = {}) => {
  const response = await fetch(`${BASE_URL}/dashboard/summary${buildQuery(query as Record<string, unknown>)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};
