import { BASE_URL } from "./api";
import type { MedicalConditionFormData } from "@/types/MedicalCondition";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getMedicalConditions = async () => {
  const response = await fetch(`${BASE_URL}/medical-conditions`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch conditions");
  return data;
};

export const createMedicalCondition = async (data: MedicalConditionFormData) => {
  const response = await fetch(`${BASE_URL}/medical-conditions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to create condition");
  return json;
};

export const updateMedicalCondition = async (id: string, data: MedicalConditionFormData) => {
  const response = await fetch(`${BASE_URL}/medical-conditions/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to update condition");
  return json;
};

export const deleteMedicalCondition = async (id: string) => {
  const response = await fetch(`${BASE_URL}/medical-conditions/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to delete condition");
  return json;
};
