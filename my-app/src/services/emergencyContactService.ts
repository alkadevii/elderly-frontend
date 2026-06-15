import { BASE_URL } from "./api";
import type { EmergencyContactFormData } from "@/types/EmergencyContact";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getEmergencyContacts = async () => {
  const response = await fetch(`${BASE_URL}/emergency-contacts`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch contacts");
  return data;
};

export const createEmergencyContact = async (
  data: EmergencyContactFormData,
) => {
  const response = await fetch(`${BASE_URL}/emergency-contacts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to create contact");
  return json;
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
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to update contact");
  return json;
};

export const deleteEmergencyContact = async (id: string) => {
  const response = await fetch(`${BASE_URL}/emergency-contacts/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to delete contact");
  return json;
};
