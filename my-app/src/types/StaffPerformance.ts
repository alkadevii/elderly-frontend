export type StaffAppointmentStats = {
  total: number;
  completed: number;
  scheduled: number;
  pendingConfirmation: number;
  pending: number;
  userConfirmed: number;
  cancelled: number;
  rejected: number;
  cancellationRequested: number;
  resolutionRate: number;
};

export type StaffPerformanceItem = {
  staff: { _id: string; name: string; email: string; phone?: string };
  assignedUsers: number;
  appointments: StaffAppointmentStats;
};

export type StaffPerformanceData = {
  summary: {
    totalStaff: number;
    totalAppointments: number;
    totalCompleted: number;
    totalCancelled: number;
    totalRejected: number;
    overallResolutionRate: number;
  };
  staffPerformance: StaffPerformanceItem[];
};
