import { BASE_URL, handleResponse } from "./api";
import type { HospitalFormData } from "@/types/Hospital";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getHospitals = async (all?: boolean) => {
  const query = all ? "?all=true" : "";
  const response = await fetch(`${BASE_URL}/hospitals${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createHospital = async (data: HospitalFormData) => {
  const response = await fetch(`${BASE_URL}/hospitals`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateHospital = async (id: string, data: Partial<HospitalFormData>) => {
  const response = await fetch(`${BASE_URL}/hospitals/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteHospital = async (id: string) => {
  const response = await fetch(`${BASE_URL}/hospitals/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};
