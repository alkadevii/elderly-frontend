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

export const getAuditLogs = async (query: Record<string, unknown> = {}) => {
  const response = await fetch(`${BASE_URL}/audit-logs${buildQuery(query)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getAuditLogStats = async () => {
  const response = await fetch(`${BASE_URL}/audit-logs/stats`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};
