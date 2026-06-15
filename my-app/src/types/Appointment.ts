export type Appointment = {
  _id: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
};

export type AppointmentFormData = {
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
};
