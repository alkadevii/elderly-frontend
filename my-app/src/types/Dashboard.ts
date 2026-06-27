export type AppointmentAdherence = {
  total: number;
  completed: number;
  cancelled: number;
  rejected: number;
  scheduled: number;
  nonCancelled: number;
  adherenceRate: number;
};

export type AbnormalReading = {
  _id: string;
  value: number;
  secondaryValue?: number;
  date: string;
  unit?: string;
  assessment?: {
    status: string;
    label: string;
  };
};

export type VitalTypeAnomaly = {
  total: number;
  abnormal: number;
  normal: number;
  anomalyRate: number;
  abnormalReadings: AbnormalReading[];
};

export type VitalAnomalies = {
  anomalies: Record<string, VitalTypeAnomaly>;
  summary: {
    totalReadings: number;
    totalAnomalies: number;
    overallAnomalyRate: number;
  };
};

export type PerMedicationCompliance = {
  medicineName: string;
  scheduledDoses: number;
  taken: number;
  missed: number;
  unlogged: number;
  compliance: number;
};

export type MedicationCompliance = {
  totalScheduled: number;
  totalTaken: number;
  totalMissed: number;
  overallCompliance: number;
  perMedication: PerMedicationCompliance[];
};

export type DashboardSummary = {
  appointmentAdherence: AppointmentAdherence;
  vitalAnomalies: VitalAnomalies;
  medicationCompliance: MedicationCompliance;
};
