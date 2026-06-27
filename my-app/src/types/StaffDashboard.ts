import type { User } from "./User";
import type { Appointment } from "./Appointment";

export type AppointmentStats = {
  total: number;
  completed: number;
  feedbackProvided: number;
  awaitingFeedback: number;
  scheduled: number;
  pendingConfirmation: number;
  pending: number;
  userConfirmed: number;
  cancelled: number;
  rejected: number;
  cancellationRequested: number;
  resolved: number;
  nonCancelled: number;
  resolutionRate: number;
};

export type PendingActions = {
  pendingReview: number;
  awaitingFeedback: number;
  feedbackToClose: number;
  cancellationRequests: number;
};

export type StaffActivity = {
  appointmentsProposed: number;
  appointmentsReviewed: number;
  appointmentsFinalized: number;
  appointmentsClosed: number;
  totalActions: number;
};

export type RecentActivityItem = {
  action: string;
  targetModel: string;
  createdAt: string;
  details?: Record<string, unknown>;
};

export type StaffDashboardData = {
  assignedUsers: {
    total: number;
    list: User[];
  };
  appointmentStats: AppointmentStats;
  pendingActions: PendingActions;
  todaySchedule: {
    date: string;
    appointments: Appointment[];
    total: number;
  };
  myActivity: StaffActivity;
  recentActivity: RecentActivityItem[];
};
