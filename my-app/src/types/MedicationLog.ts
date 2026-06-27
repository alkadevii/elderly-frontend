export type MedicationLogStatus = "taken" | "missed" | "skipped";

export type MedicationLog = {
  _id: string;
  user?: string | { _id: string; name: string; email: string };
  medication:
    | string
    | { _id: string; medicineName: string; dosage?: string; scheduleTimes?: string[] };
  status: MedicationLogStatus;
  taken?: boolean;
  scheduledTime: string;
  date: string;
  notes?: string;
  loggedAt?: string;
  createdAt?: string;
  actualTime?: string;
  updatedAt?: string;
};

export type MedicationLogFormData = {
  medication: string;
  taken?: boolean;
  status: MedicationLogStatus;
  scheduledTime?: string;
  date?: string;
  userId?: string;
  notes?: string;
};

export type SlotStatus = "taken" | "missed" | "due" | "pending" | "skipped";

export type TodaySlot = {
  scheduledTime: string;
  status: SlotStatus;
  log: MedicationLog | null;
};

export type TodayMedicationView = {
  medication: {
    _id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    scheduleTimes: string[];
    gracePeriodMinutes?: number;
  };
  date: string;
  slots: TodaySlot[];
  taken: number;
  missed: number;
  due: number;
  pending: number;
  skipped: number;
  total: number;
};

export type ReminderItem = {
  medication: {
    _id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    scheduleTimes: string[];
  };
  scheduledTime: string;
  date: string;
  status: "due" | "missed";
  minutesOverdue?: number;
  gracePeriodMinutes?: number;
};

export type RemindersResponse = {
  due: ReminderItem[];
  missed: ReminderItem[];
  totalDue: number;
  totalMissed: number;
};
