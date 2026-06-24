export type AppointmentStatus =
  | "pending"
  | "pending_confirmation"
  | "user_confirmed"
  | "approved"
  | "scheduled"
  | "awaiting_feedback"
  | "feedback_provided"
  | "completed"
  | "cancelled"
  | "rejected"
  | "cancellation_requested";

export type CancelledBy = "user" | "staff" | "admin";

export type Appointment = {
  _id: string;
  doctorName: string;
  hospital?: string;
  appointmentDate: string;
  reason: string;
  status: AppointmentStatus;
  previousStatus?: AppointmentStatus;
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
  feedbackNotes?: string;
  feedbackProvidedAt?: string;
  completedBy?: {
    _id: string;
    name: string;
    email: string;
  } | null;
  completedAt?: string | null;
  cancelledBy?: CancelledBy;
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
  status: "scheduled" | "rejected";
  reviewNotes?: string;
  tokenNumber?: string;
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

export type AppointmentFeedbackData = {
  feedbackNotes: string;
};

export type AppointmentCancelData = {
  reason?: string;
};
