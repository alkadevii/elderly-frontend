import { BASE_URL, handleResponse } from "./api";
import type { EmergencyContactFormData } from "@/types/EmergencyContact";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getEmergencyContacts = async (userId?: string) => {
  const query = userId ? `?userId=${userId}` : "";
  const response = await fetch(`${BASE_URL}/emergency-contacts${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createEmergencyContact = async (
  data: EmergencyContactFormData & { userId?: string },
) => {
  const response = await fetch(`${BASE_URL}/emergency-contacts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateEmergencyContact = async (
  id: string,
  data: EmergencyContactFormData,
) => {
  const response = await fetch(`${BASE_URL}/emergency-contacts/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteEmergencyContact = async (id: string) => {
  const response = await fetch(`${BASE_URL}/emergency-contacts/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
