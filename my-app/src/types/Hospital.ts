export type Hospital = {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type HospitalFormData = {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
};
