// src/types/User.ts

export type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
  profileCompleted?: boolean;

  age?: number;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  medicalConditions?: string;
  profileImage?: string;
};