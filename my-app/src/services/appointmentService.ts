import { BASE_URL } from "./api";
import type { AppointmentFormData } from "@/types/Appointment";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getAppointments = async () => {
  const response = await fetch(`${BASE_URL}/appointments`, {
    headers: getHeaders(),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to fetch appointments");
  return data;
};

export const createAppointment = async (data: AppointmentFormData) => {
  const response = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to create appointment");
  return json;
};

export const updateAppointment = async (id: string, data: AppointmentFormData) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to update appointment");
  return json;
};

export const deleteAppointment = async (id: string) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.message || "Failed to delete appointment");
  return json;
};
