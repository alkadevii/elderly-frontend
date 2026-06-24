export type Medication = {
  _id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  startDate: string;
  endDate?: string;
};

export type MedicationFormData = {
  medicineName: string;
  dosage: string;
  frequency: string;
  scheduleTimes: string[];
  startDate: string;
  endDate?: string;
};
