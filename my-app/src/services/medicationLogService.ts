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

export type MedicationLogQuery = {
  userId?: string;
  medication?: string;
  status?: string;
  date?: string;
  from?: string;
  to?: string;
  limit?: number;
};

export const createMedicationLog = async (data: {
  medication: string;
  taken?: boolean;
  status: "taken" | "missed" | "skipped";
  scheduledTime?: string;
  date?: string;
  userId?: string;
  notes?: string;
}) => {
  const response = await fetch(`${BASE_URL}/medication-logs`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const getMedicationLogs = async (query: MedicationLogQuery = {}) => {
  const response = await fetch(`${BASE_URL}/medication-logs${buildQuery(query as Record<string, unknown>)}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getTodayLogs = async (userId?: string) => {
  const query = userId ? `?userId=${userId}` : "";
  const response = await fetch(`${BASE_URL}/medication-logs/today${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getReminders = async (params?: { userId?: string; from?: string; to?: string }) => {
  const query = buildQuery((params || {}) as Record<string, unknown>);
  const response = await fetch(`${BASE_URL}/medication-logs/reminders${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const updateMedicationLog = async (id: string, data: { status?: string; taken?: boolean; notes?: string }) => {
  const response = await fetch(`${BASE_URL}/medication-logs/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteMedicationLog = async (id: string) => {
  const response = await fetch(`${BASE_URL}/medication-logs/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
