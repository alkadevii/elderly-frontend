"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { ReminderItem, RemindersResponse } from "@/types/MedicationLog";
import { getReminders, createMedicationLog } from "@/services/medicationLogService";

const { Title, Text } = Typography;

function useMedicationNotifications(due: ReminderItem[]) {
  const notifiedRef = useRef<Set<string>>(new Set());
  const readyRef = useRef(false);

  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (Notification.permission !== "granted") return;
    if (!readyRef.current) {
      due.forEach((r) => notifiedRef.current.add(`${r.medication._id}-${r.scheduledTime}`));
      readyRef.current = true;
      return;
    }

    due.forEach((r) => {
      const key = `${r.medication._id}-${r.scheduledTime}`;
      if (notifiedRef.current.has(key)) return;
      notifiedRef.current.add(key);

      const n = new Notification("Medication Due", {
        body: `${r.medication.medicineName} (${r.medication.dosage}) scheduled at ${r.scheduledTime} — please log it.`,
        icon: "/favicon.ico",
        tag: `med-${r.medication._id}`,
        requireInteraction: true,
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    });
  }, [due]);
}

function ReminderPill({
  reminder,
  onLog,
  loggingId,
}: {
  reminder: ReminderItem;
  onLog: (r: ReminderItem, status: "taken" | "missed") => void;
  loggingId: string | null;
}) {
  const isDue = reminder.status === "due";
  const id = `${reminder.medication._id}-${reminder.scheduledTime}`;
  const color = isDue ? "gold" : "red";
  const icon = isDue ? <ExclamationCircleOutlined /> : <CloseCircleOutlined />;

  return (
    <Tooltip
      title={
        <div>
          <div>{reminder.medication.medicineName} ({reminder.medication.dosage})</div>
          <div>Scheduled: {reminder.scheduledTime}</div>
          {isDue && reminder.minutesOverdue !== undefined && (
            <div>{reminder.minutesOverdue} min overdue</div>
          )}
        </div>
      }
    >
      <Tag
        color={color}
        style={{
          padding: "4px 10px",
          fontSize: 13,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 4,
        }}
      >
        {icon}
        {reminder.medication.medicineName} @ {reminder.scheduledTime}
        <Space size={4} style={{ marginLeft: 6 }}>
          <Button
            size="small"
            type="text"
            icon={<CheckCircleOutlined />}
            loading={loggingId === id}
            onClick={(e) => { e.stopPropagation(); onLog(reminder, "taken"); }}
            style={{ color: "#52c41a", padding: 0, height: "auto" }}
          />
          <Button
            size="small"
            type="text"
            icon={<CloseCircleOutlined />}
            loading={loggingId === id}
            onClick={(e) => { e.stopPropagation(); onLog(reminder, "missed"); }}
            style={{ color: "#ff4d4f", padding: 0, height: "auto" }}
          />
        </Space>
      </Tag>
    </Tooltip>
  );
}

export default function MedicationReminderBanner() {
  const [due, setDue] = useState<ReminderItem[]>([]);
  const [missed, setMissed] = useState<ReminderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const warnedRef = useRef(false);

  useMedicationNotifications(due);

  const fetchReminders = useCallback(async () => {
    try {
      const res = await getReminders();
      const data: RemindersResponse = res.data || res;
      setDue(Array.isArray(data.due) ? data.due : []);
      setMissed(Array.isArray(data.missed) ? data.missed : []);
      warnedRef.current = false;
    } catch {
      if (!warnedRef.current) {
        message.warning("Could not check medication reminders");
        warnedRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
    const interval = setInterval(fetchReminders, 60000);
    return () => clearInterval(interval);
  }, [fetchReminders]);

  const handleLog = async (reminder: ReminderItem, status: "taken" | "missed") => {
    setLoggingId(`${reminder.medication._id}-${reminder.scheduledTime}`);
    try {
      await createMedicationLog({
        medication: reminder.medication._id,
        taken: status === "taken",
        status,
        scheduledTime: reminder.scheduledTime,
      });
      message.success(`Marked as ${status}`);
      fetchReminders();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to log");
    } finally {
      setLoggingId(null);
    }
  };

  if (loading && due.length === 0 && missed.length === 0) return null;
  if (due.length === 0 && missed.length === 0) return null;

  const hasMissed = missed.length > 0;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 24,
        borderRadius: 16,
        border: hasMissed ? "1px solid #fca5a5" : "1px solid #fde68a",
        background: hasMissed ? "#fef2f2" : "#fffbeb",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <BellOutlined style={{ fontSize: 18, color: hasMissed ? "#ef4444" : "#d97706", marginTop: 2 }} />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Title level={5} style={{ margin: 0, color: hasMissed ? "#ef4444" : "#d97706" }}>
              Medication Reminders
            </Title>
            {due.length > 0 && <Tag color="gold">{due.length} due</Tag>}
            {missed.length > 0 && <Tag color="red">{missed.length} missed</Tag>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {due.map((r) => (
              <ReminderPill key={`due-${r.medication._id}-${r.scheduledTime}`} reminder={r} onLog={handleLog} loggingId={loggingId} />
            ))}
            {missed.map((r) => (
              <ReminderPill key={`missed-${r.medication._id}-${r.scheduledTime}`} reminder={r} onLog={handleLog} loggingId={loggingId} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
