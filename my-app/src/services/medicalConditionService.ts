import { BASE_URL, handleResponse } from "./api";
import type { MedicalConditionFormData } from "@/types/MedicalCondition";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getMedicalConditions = async (userId?: string) => {
  const query = userId ? `?userId=${userId}` : "";
  const response = await fetch(`${BASE_URL}/medical-conditions${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createMedicalCondition = async (data: MedicalConditionFormData & { userId?: string }) => {
  const response = await fetch(`${BASE_URL}/medical-conditions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateMedicalCondition = async (id: string, data: MedicalConditionFormData) => {
  const response = await fetch(`${BASE_URL}/medical-conditions/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteMedicalCondition = async (id: string) => {
  const response = await fetch(`${BASE_URL}/medical-conditions/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
