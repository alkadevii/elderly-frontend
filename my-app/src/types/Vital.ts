export type VitalType =
  | "blood_pressure"
  | "blood_glucose"
  | "heart_rate"
  | "weight"
  | "temperature"
  | "oxygen_saturation";

export type VitalAssessmentStatus =
  | "low"
  | "normal"
  | "elevated"
  | "high"
  | "high_stage1"
  | "high_stage2"
  | "critical"
  | "info";

export type VitalAssessment = {
  status: VitalAssessmentStatus;
  label: string;
};

export type Vital = {
  _id: string;
  user: string;
  type: VitalType;
  value: number;
  secondaryValue?: number;
  unit: string;
  recordedAt: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
  assessment?: VitalAssessment;
};

export type VitalFormData = {
  type: VitalType;
  value: number;
  secondaryValue?: number;
  unit?: string;
  recordedAt?: string;
  notes?: string;
  userId?: string;
};

export type VitalSeriesPoint = {
  _id: string;
  value: number;
  secondaryValue?: number;
  recordedAt: string;
  notes?: string;
  assessment?: VitalAssessment;
};

export type VitalTrend = {
  unit: string;
  count: number;
  min: number;
  max: number;
  avg: number;
  latest: {
    value: number;
    secondaryValue?: number;
    recordedAt: string;
    assessment?: VitalAssessment;
  };
  series: VitalSeriesPoint[];
};

export type VitalTrends = Record<string, VitalTrend>;

export type VitalRange = {
  status: VitalAssessmentStatus;
  label: string;
  min?: number;
  max?: number;
  display: string;
};

export type VitalRangesResponse = {
  type: string;
  unit: string;
  ranges: VitalRange[];
};
