export type MedicalCondition = {
  _id: string;
  condition: string;
  diagnosedDate?: string;
  notes?: string;
};

export type MedicalConditionFormData = {
  condition: string;
  diagnosedDate?: string;
  notes?: string;
};
