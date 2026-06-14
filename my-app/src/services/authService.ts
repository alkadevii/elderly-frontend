import { BASE_URL } from "./api";

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

export type LoginData = {
  email: string;
  password: string;
};

export type UpdateProfileData = {
  age?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  profileImage?: string;
};

export const registerUser = async (
  userData: RegisterData
) => {
  const response = await fetch(
    `${BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  return response.json();
};

export const loginUser = async (
  userData: LoginData
) => {
  const response = await fetch(
    `${BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  return response.json();
};

export const updateProfile = async (
  userId: string,
  profileData: UpdateProfileData
) => {
  const response = await fetch(
    `${BASE_URL}/auth/profile/${userId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(profileData),
    }
  );

  return response.json();
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("token");

  const response = await fetch(
    `${BASE_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};