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

export type VitalRange = {
  status: VitalAssessmentStatus;
  label: string;
  min?: number;
  max?: number;
  display: string;
};

export type VitalRanges = {
  type: string;
  unit: string;
  ranges: VitalRange[];
};

const statusColors: Record<VitalAssessmentStatus, string> = {
  low: "orange",
  normal: "green",
  elevated: "orange",
  high: "red",
  high_stage1: "red",
  high_stage2: "red",
  critical: "red",
  info: "default",
};

const statusTextColor: Record<VitalAssessmentStatus, string> = {
  low: "#d97706",
  normal: "#10b981",
  elevated: "#d97706",
  high: "#ef4444",
  high_stage1: "#ef4444",
  high_stage2: "#ef4444",
  critical: "#ef4444",
  info: "#6b7280",
};

export function assessmentColor(status: VitalAssessmentStatus): string {
  return statusColors[status] || "default";
}

export function assessmentTextColor(status: VitalAssessmentStatus): string {
  return statusTextColor[status] || "#6b7280";
}

function inRange(value: number, min?: number, max?: number): boolean {
  if (min !== undefined && max !== undefined) return value >= min && value <= max;
  if (min !== undefined) return value >= min;
  if (max !== undefined) return value <= max;
  return true;
}

function evaluateBloodPressure(systolic: number, diastolic: number): VitalAssessment {
  if (systolic < 90 || diastolic < 60) return { status: "low", label: "Low" };
  if (systolic >= 180 || diastolic >= 120) return { status: "high_stage2", label: "Hypertensive Crisis (Stage 2)" };
  if (systolic >= 140 || diastolic >= 90) return { status: "high_stage1", label: "Hypertension Stage 1" };
  if (systolic >= 130 || diastolic >= 80) return { status: "elevated", label: "Elevated" };
  if (systolic >= 90 && systolic <= 120 && diastolic >= 60 && diastolic <= 80) return { status: "normal", label: "Normal" };
  return { status: "normal", label: "Normal" };
}

function evaluateBloodGlucose(value: number): VitalAssessment {
  if (value < 70) return { status: "low", label: "Low (Hypoglycemia)" };
  if (value >= 70 && value <= 99) return { status: "normal", label: "Normal (Fasting)" };
  if (value >= 100 && value <= 125) return { status: "elevated", label: "Elevated (Pre-diabetes)" };
  return { status: "high", label: "High (Hyperglycemia)" };
}

function evaluateHeartRate(value: number): VitalAssessment {
  if (value < 60) return { status: "low", label: "Low (Bradycardia)" };
  if (value >= 60 && value <= 100) return { status: "normal", label: "Normal" };
  return { status: "high", label: "High (Tachycardia)" };
}

function evaluateWeight(): VitalAssessment {
  return { status: "info", label: "No universal range — consult provider" };
}

function evaluateTemperature(value: number): VitalAssessment {
  if (value < 36.1) return { status: "low", label: "Low (Hypothermia)" };
  if (value >= 36.1 && value <= 37.2) return { status: "normal", label: "Normal" };
  return { status: "high", label: "High (Fever)" };
}

function evaluateOxygenSaturation(value: number): VitalAssessment {
  if (value < 90) return { status: "critical", label: "Critical (Hypoxemia)" };
  if (value >= 90 && value <= 94) return { status: "low", label: "Low" };
  return { status: "normal", label: "Normal" };
}

export function evaluateVital(
  type: string,
  value: number,
  secondaryValue?: number
): VitalAssessment {
  switch (type) {
    case "blood_pressure":
      return evaluateBloodPressure(value, secondaryValue ?? 0);
    case "blood_glucose":
      return evaluateBloodGlucose(value);
    case "heart_rate":
      return evaluateHeartRate(value);
    case "weight":
      return evaluateWeight();
    case "temperature":
      return evaluateTemperature(value);
    case "oxygen_saturation":
      return evaluateOxygenSaturation(value);
    default:
      return { status: "info", label: "Unknown" };
  }
}

export function getVitalRanges(): VitalRanges[] {
  return [
    {
      type: "blood_pressure",
      unit: "mmHg",
      ranges: [
        { status: "low", label: "Low", max: 89, display: "Systolic < 90 or Diastolic < 60" },
        { status: "normal", label: "Normal", min: 90, max: 120, display: "90–119 / 60–79" },
        { status: "elevated", label: "Elevated", min: 120, max: 129, display: "120–129 / < 80" },
        { status: "high_stage1", label: "Stage 1 HTN", min: 130, max: 139, display: "130–139 / 80–89" },
        { status: "high_stage2", label: "Stage 2 HTN", min: 140, display: "≥ 140 or ≥ 90" },
      ],
    },
    {
      type: "blood_glucose",
      unit: "mg/dL",
      ranges: [
        { status: "low", label: "Low", max: 69, display: "< 70" },
        { status: "normal", label: "Normal", min: 70, max: 99, display: "70–99 (Fasting)" },
        { status: "elevated", label: "Pre-diabetes", min: 100, max: 125, display: "100–125" },
        { status: "high", label: "High", min: 126, display: "≥ 126" },
      ],
    },
    {
      type: "heart_rate",
      unit: "bpm",
      ranges: [
        { status: "low", label: "Low", max: 59, display: "< 60" },
        { status: "normal", label: "Normal", min: 60, max: 100, display: "60–100" },
        { status: "high", label: "High", min: 101, display: "> 100" },
      ],
    },
    {
      type: "weight",
      unit: "kg",
      ranges: [
        { status: "info", label: "Individual", display: "No universal range" },
      ],
    },
    {
      type: "temperature",
      unit: "°C",
      ranges: [
        { status: "low", label: "Low", max: 36.0, display: "< 36.1" },
        { status: "normal", label: "Normal", min: 36.1, max: 37.2, display: "36.1–37.2" },
        { status: "high", label: "High", min: 37.3, display: "> 37.2" },
      ],
    },
    {
      type: "oxygen_saturation",
      unit: "%",
      ranges: [
        { status: "critical", label: "Critical", max: 89, display: "< 90%" },
        { status: "low", label: "Low", min: 90, max: 94, display: "90–94%" },
        { status: "normal", label: "Normal", min: 95, display: "≥ 95%" },
      ],
    },
  ];
}
