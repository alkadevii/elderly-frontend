import { BASE_URL, handleResponse } from "./api";

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
  profileImage?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: "male" | "female" | "other";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  identificationMark?: string;
  phone?: string;
  address?: string;
  emergencyNotes?: string;
};

export const registerUser = async (
  userData: RegisterData
) => {
  const response = await fetch(
    `${BASE_URL}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  return handleResponse(response);
};

export const loginUser = async (
  userData: LoginData
) => {
  const response = await fetch(
    `${BASE_URL}/auth/login`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(userData),
    }
  );

  return handleResponse(response);
};

export const getCurrentUser =
  async () => {
    const token =
      localStorage.getItem("token");

    const response = await fetch(
      `${BASE_URL}/auth/me`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return handleResponse(response);
  };

export const updateProfile =
  async (
    profileData: UpdateProfileData
  ) => {
    const token =
      localStorage.getItem("token");

    const response = await fetch(
      `${BASE_URL}/auth/profile`,
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          profileData
        ),
      }
    );

    return handleResponse(response);
  };