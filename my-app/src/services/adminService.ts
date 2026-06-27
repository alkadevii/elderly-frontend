import { BASE_URL, handleResponse } from "./api";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getUsers = async (params?: { role?: string; verificationStatus?: string }) => {
  const query = new URLSearchParams();
  if (params?.role) query.set("role", params.role);
  if (params?.verificationStatus) query.set("verificationStatus", params.verificationStatus);
  const url = `${BASE_URL}/auth/users${query.toString() ? "?" + query.toString() : ""}`;
  const response = await fetch(url, { headers: getHeaders() });
  return handleResponse(response);
};

export const getPendingProfiles = async () => {
  const response = await fetch(`${BASE_URL}/auth/pending-profiles`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const verifyProfile = async (
  userId: string,
  data: { status: "verified" | "rejected"; verificationNotes?: string }
) => {
  const response = await fetch(`${BASE_URL}/auth/verify-profile/${userId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const assignStaff = async (userId: string, staffId: string) => {
  const response = await fetch(`${BASE_URL}/auth/assign-staff/${userId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify({ staffId }),
  });
  return handleResponse(response);
};

export const createStaff = async (data: { name: string; email: string; password: string }) => {
  const response = await fetch(`${BASE_URL}/auth/create-staff`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const getStaff = async () => {
  const response = await fetch(`${BASE_URL}/auth/staff`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getAssignedUsers = async () => {
  const response = await fetch(`${BASE_URL}/auth/assigned-users`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getStaffDashboard = async () => {
  const response = await fetch(`${BASE_URL}/staff/dashboard`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const getStaffPerformance = async () => {
  const response = await fetch(`${BASE_URL}/staff/performance`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};
