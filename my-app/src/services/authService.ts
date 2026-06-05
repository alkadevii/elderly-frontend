import { BASE_URL } from "./api";

type RegisterData = {
  name: string;
  email: string;
  password: string;
  role?: string;
};

type LoginData = {
  email: string;
  password: string;
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