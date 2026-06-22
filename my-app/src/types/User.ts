export type StaffSummary = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
};

export type User = {
  _id: string;
  id: string;
  name: string;
  email: string;
  role?: string;
  profileCompleted?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
  profileImage?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  bloodGroup?: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  identificationMark?: string;
  emergencyNotes?: string;
  phone?: string;
  address?: string;
  emergencyContact?: string;
  medicalConditions?: string[];
  assignedStaff?: StaffSummary | null;
  createdAt?: string;
  updatedAt?: string;
};
