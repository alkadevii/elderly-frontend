export type MedicalCondition = {
  _id: string;
  conditionName: string;
  diagnosedDate?: string;
  severity: "mild" | "moderate" | "severe";
  notes?: string;
};

export type MedicalConditionFormData = {
  conditionName: string;
  diagnosedDate?: string;
  severity: "mild" | "moderate" | "severe";
  notes?: string;
};
