import { BASE_URL, handleResponse } from "./api";
import type { MedicationFormData } from "@/types/Medication";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getMedications = async (userId?: string) => {
  const query = userId ? `?userId=${userId}` : "";
  const response = await fetch(`${BASE_URL}/medications${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createMedication = async (data: MedicationFormData & { userId?: string }) => {
  const response = await fetch(`${BASE_URL}/medications`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateMedication = async (id: string, data: MedicationFormData) => {
  const response = await fetch(`${BASE_URL}/medications/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteMedication = async (id: string) => {
  const response = await fetch(`${BASE_URL}/medications/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
