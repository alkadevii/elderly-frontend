export type AppointmentStatus =
  | "pending"
  | "pending_confirmation"
  | "user_confirmed"
  | "approved"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "rejected";

export type Appointment = {
  _id: string;
  doctorName: string;
  hospital?: string;
  appointmentDate: string;
  reason: string;
  status: AppointmentStatus;
  user?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  proposedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  reviewNotes?: string;
  reviewedAt?: string;
  confirmationNotes?: string;
  confirmedAt?: string | null;
  tokenNumber?: string;
  finalNotes?: string;
  finalizedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  finalizedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type AppointmentFormData = {
  doctorName: string;
  hospital?: string;
  appointmentDate: string;
  reason: string;
};

export type AppointmentReviewData = {
  status: "approved" | "rejected";
  reviewNotes?: string;
};

export type AppointmentConfirmData = {
  status: "confirmed" | "declined";
  confirmationNotes?: string;
};

export type AppointmentFinalizeData = {
  tokenNumber: string;
  appointmentDate?: string;
  finalNotes?: string;
};
