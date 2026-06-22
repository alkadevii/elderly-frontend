import { notification } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  BellOutlined,
} from "@ant-design/icons";
import type { ReactNode } from "react";
import dayjs from "dayjs";
import type { Appointment } from "@/types/Appointment";

type Audience = "user" | "staff";

const formatDate = (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "N/A");

const iconStyle = (color: string): Record<string, string | number> => ({
  color,
  fontSize: 28,
});

const openNotification = (
  icon: ReactNode,
  title: string,
  body: string,
  duration = 6
) => {
  notification.open({
    message: title,
    description: body,
    icon,
    duration,
    placement: "topRight",
  });
};

const notifyUserStatusChange = (appt: Appointment) => {
  const doctor = appt.doctorName || "your appointment";
  const date = formatDate(appt.appointmentDate);

  switch (appt.status) {
    case "approved":
      openNotification(
        <CheckCircleOutlined style={iconStyle("#10b981")} />,
        "Appointment Approved",
        `Your appointment with ${doctor} on ${date} has been approved.`
      );
      break;

    case "rejected":
      openNotification(
        <CloseCircleOutlined style={iconStyle("#ef4444")} />,
        "Appointment Rejected",
        `Your appointment with ${doctor} on ${date} was rejected.${
          appt.reviewNotes ? ` Reason: ${appt.reviewNotes}` : ""
        }`
      );
      break;

    case "scheduled":
      openNotification(
        <CalendarOutlined style={iconStyle("#0891b2")} />,
        "Appointment Scheduled",
        `Your appointment with ${doctor} on ${date} has been finalized.${
          appt.tokenNumber ? ` Token: ${appt.tokenNumber}` : ""
        }${appt.finalNotes ? ` — ${appt.finalNotes}` : ""}`
      );
      break;

    case "completed":
      openNotification(
        <CheckCircleOutlined style={iconStyle("#6b7280")} />,
        "Appointment Completed",
        `Your appointment with ${doctor} on ${date} has been marked as completed.`
      );
      break;

    case "cancelled":
      openNotification(
        <CloseCircleOutlined style={iconStyle("#ef4444")} />,
        "Appointment Cancelled",
        `Your appointment with ${doctor} on ${date} was cancelled.`
      );
      break;
  }
};

const notifyStaffStatusChange = (old: Appointment, appt: Appointment) => {
  const userName = appt.user?.name || "A patient";
  const doctor = appt.doctorName || "an appointment";
  const date = formatDate(appt.appointmentDate);

  switch (appt.status) {
    case "user_confirmed":
      openNotification(
        <ClockCircleOutlined style={iconStyle("#7c3aed")} />,
        "Proposal Accepted",
        `${userName} accepted the proposed appointment with ${doctor} on ${date}. Please call the hospital to finalize.`
      );
      break;

    case "cancelled":
      if (old.status === "pending_confirmation" || old.status === "user_confirmed") {
        openNotification(
          <CloseCircleOutlined style={iconStyle("#ef4444")} />,
          "Proposal Declined",
          `${userName} declined the proposed appointment with ${doctor} on ${date}.`
        );
      }
      break;
  }
};

const notifyUserNewAppointment = (appt: Appointment) => {
  if (appt.status === "pending_confirmation") {
    const doctor = appt.doctorName || "your appointment";
    const date = formatDate(appt.appointmentDate);
    const staffName = appt.proposedBy?.name || "A staff member";
    openNotification(
      <BellOutlined style={iconStyle("#f59e0b")} />,
      "New Appointment Proposal",
      `${staffName} proposed a new appointment with ${doctor} on ${date}. Please review and accept or decline.${
        appt.reviewNotes ? ` — "${appt.reviewNotes}"` : ""
      }`
    );
  }
};

const notifyStaffNewAppointment = (appt: Appointment) => {
  if (appt.status === "pending") {
    const userName = appt.user?.name || "A patient";
    const doctor = appt.doctorName || "an appointment";
    const date = formatDate(appt.appointmentDate);
    openNotification(
      <BellOutlined style={iconStyle("#0891b2")} />,
      "New Appointment Request",
      `${userName} requested an appointment with ${doctor} on ${date}.`
    );
  }
};

export const notifyAppointmentChanges = (
  prev: Appointment[],
  next: Appointment[],
  audience: Audience
) => {
  if (prev.length === 0 && next.length > 0) return;

  const prevMap = new Map(prev.map((a) => [a._id, a]));

  for (const appt of next) {
    const old = prevMap.get(appt._id);

    if (!old) {
      if (audience === "user") notifyUserNewAppointment(appt);
      else notifyStaffNewAppointment(appt);
      continue;
    }

    if (old.status !== appt.status) {
      if (audience === "user") notifyUserStatusChange(appt);
      else notifyStaffStatusChange(old, appt);
    }
  }
};
