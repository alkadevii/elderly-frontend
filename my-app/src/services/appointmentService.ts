import { BASE_URL, handleResponse } from "./api";
import type {
  AppointmentFormData,
  AppointmentReviewData,
  AppointmentConfirmData,
  AppointmentFinalizeData,
} from "@/types/Appointment";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const getAppointments = async (userId?: string) => {
  const query = userId ? `?userId=${userId}` : "";
  const response = await fetch(`${BASE_URL}/appointments${query}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createAppointment = async (
  data: AppointmentFormData & { userId?: string; reviewNotes?: string }
) => {
  const response = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateAppointment = async (id: string, data: Partial<AppointmentFormData> & { status?: string }) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteAppointment = async (id: string) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const reviewAppointment = async (id: string, data: AppointmentReviewData) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}/review`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const confirmAppointment = async (id: string, data: AppointmentConfirmData) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}/confirm`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const finalizeAppointment = async (id: string, data: AppointmentFinalizeData) => {
  const response = await fetch(`${BASE_URL}/appointments/${id}/finalize`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};
