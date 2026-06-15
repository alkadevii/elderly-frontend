import { BASE_URL } from "./api";
import type { MedicationFormData } from "@/types/Medication";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getMedications = async () => {
  const response = await fetch(`${BASE_URL}/medications`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch medications");
  return data;
};

export const createMedication = async (data: MedicationFormData) => {
  const response = await fetch(`${BASE_URL}/medications`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to create medication");
  return json;
};

export const updateMedication = async (id: string, data: MedicationFormData) => {
  const response = await fetch(`${BASE_URL}/medications/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to update medication");
  return json;
};

export const deleteMedication = async (id: string) => {
  const response = await fetch(`${BASE_URL}/medications/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to delete medication");
  return json;
};
