"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Select,
  Switch,
  Popconfirm,
  message,
  Tag,
  Typography,
  Space,
  Segmented,
  DatePicker,
  Alert,
  Input,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlusOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { MedicationLog, TodayMedicationView, ReminderItem } from "@/types/MedicationLog";
import type { Medication } from "@/types/Medication";
import {
  getTodayLogs,
  getMedicationLogs,
  createMedicationLog,
  deleteMedicationLog,
  updateMedicationLog,
  getReminders,
} from "@/services/medicationLogService";
import { getMedications } from "@/services/medicationService";

const { Title, Text } = Typography;

type TodayScheduleItem = {
  key: string;
  medicationId: string;
  medicationName: string;
  dosage?: string;
  scheduledTime: string;
  status: "due" | "taken" | "missed" | "skipped" | "pending";
  minutesOverdue?: number;
  date?: string;
};

const statusColors: Record<string, string> = {
  due: "gold",
  taken: "green",
  missed: "red",
  skipped: "orange",
  pending: "default",
};

const statusIcons: Record<string, React.ReactNode> = {
  due: <CheckCircleOutlined />,
  taken: <CheckCircleOutlined />,
  missed: <CloseCircleOutlined />,
  skipped: <MinusCircleOutlined />,
  pending: <HistoryOutlined />,
};

export default function MedicationLogSection() {
  const [view, setView] = useState<"today" | "history" | "missed">("today");
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState<TodayScheduleItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [historyDateRange, setHistoryDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [initialFormValues, setInitialFormValues] = useState<Record<string, unknown> | undefined>(undefined);
  const [editingLog, setEditingLog] = useState<MedicationLog | null>(null);
  const [form] = Form.useForm();
  const [missedReminders, setMissedReminders] = useState<ReminderItem[]>([]);
  const [dueReminders, setDueReminders] = useState<ReminderItem[]>([]);
  const [missedDateRange, setMissedDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs().subtract(7, "day"), dayjs()]);

  const getMedicationName = useCallback((med: unknown): string => {
    if (!med) return "Unknown";
    if (typeof med === "string") {
      const found = medications.find((m) => m._id === med);
      return found ? found.medicineName : "Unknown";
    }
    const m = med as { _id?: string; medicineName?: string };
    return m.medicineName || "Unknown";
  }, [medications]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      const medsPromise = getMedications();

      if (view === "missed") {
        const [remindersRes, medsRes] = await Promise.all([
          getReminders({
            from: missedDateRange[0].format("YYYY-MM-DD"),
            to: missedDateRange[1].format("YYYY-MM-DD"),
          }),
          medsPromise,
        ]);
        const data = remindersRes.data || remindersRes;
        setDueReminders(Array.isArray(data.due) ? data.due : []);
        setMissedReminders(Array.isArray(data.missed) ? data.missed : []);
        const list = Array.isArray(medsRes) ? medsRes : (medsRes.data || medsRes.medications || []);
        setMedications(list);
      } else {
        const logPromise = view === "today"
          ? getTodayLogs()
          : getMedicationLogs(
              historyDateRange?.[0] && historyDateRange?.[1]
                ? { from: historyDateRange[0].format("YYYY-MM-DD"), to: historyDateRange[1].format("YYYY-MM-DD") }
                : {}
            );
        const [res, medsRes] = await Promise.all([
          logPromise,
          medsPromise,
        ]);
        const list = Array.isArray(medsRes) ? medsRes : (medsRes.data || medsRes.medications || []);
        setMedications(list);

        if (view === "today") {
          const views: TodayMedicationView[] = Array.isArray(res) ? res : res.data || [];
          const items: TodayScheduleItem[] = [];
          for (const v of views) {
            for (const slot of v.slots) {
              items.push({
                key: `${v.medication._id}-${slot.scheduledTime}`,
                medicationId: v.medication._id,
                medicationName: v.medication.medicineName,
                dosage: v.medication.dosage,
                scheduledTime: slot.scheduledTime,
                status: slot.status,
                date: v.date,
              });
            }
          }
          items.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
          setSchedule(items);
        } else {
          const logs = Array.isArray(res) ? res : res.data || res.logs || [];
          setLogs(logs);
        }
      }
    } catch {
      message.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [view, historyDateRange, missedDateRange]);

  useEffect(() => {
    let cancelled = false;
    refreshData().then(() => {}).catch(() => {});
    return () => { cancelled = true; };
  }, [refreshData]);

  const openLog = (prefill?: { status?: "taken" | "missed" | "skipped"; date?: dayjs.Dayjs; medicationId?: string; scheduledTime?: string }) => {
    if (medications.length === 0) {
      message.warning("No medications found. Add a medication first.");
      return;
    }
    setEditingLog(null);
    setInitialFormValues({
      date: prefill?.date || dayjs(),
      taken: prefill?.status === "taken",
      ...(prefill?.status ? { status: prefill.status } : {}),
      ...(prefill?.medicationId ? { medication: prefill.medicationId } : {}),
      ...(prefill?.scheduledTime ? { scheduledTime: prefill.scheduledTime } : {}),
    });
    setModalOpen(true);
  };

  const openEditLog = (log: MedicationLog) => {
    setEditingLog(log);
    const medId = typeof log.medication === "string" ? log.medication : log.medication._id;
    setInitialFormValues({
      medication: medId,
      status: log.status,
      taken: log.taken,
      scheduledTime: log.scheduledTime,
      date: log.date ? dayjs(log.date) : dayjs(),
      notes: log.notes || "",
    });
    setModalOpen(true);
  };

  const setDateOnForm = (d: dayjs.Dayjs) => {
    form.setFieldsValue({ date: d });
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    const status = values.status as "taken" | "missed" | "skipped";
    const taken = values.taken as boolean | undefined;
    const notes = values.notes as string | undefined;

    setSubmitting(true);
    try {
      if (editingLog) {
        await updateMedicationLog(editingLog._id, { status, taken, notes });
        message.success("Log entry updated");
      } else {
        await createMedicationLog({
          medication: values.medication as string,
          taken,
          status,
          scheduledTime: values.scheduledTime as string | undefined,
          date: values.date ? dayjs(values.date as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD") : undefined,
          notes,
        });
        message.success("Medication logged");
      }
      setModalOpen(false);
      refreshData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to log medication");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedicationLog(id);
      message.success("Log entry deleted");
      refreshData();
    } catch {
      message.error("Failed to delete log");
    }
  };

  const handleMissedLog = async (item: ReminderItem) => {
    const id = `missed-${item.medication._id}-${item.date}-${item.scheduledTime}`;
    setLoggingId(id);
    try {
      await createMedicationLog({
        medication: item.medication._id,
        taken: true,
        status: "taken",
        scheduledTime: item.scheduledTime,
        date: item.date,
      });
      message.success("Marked as taken");
      refreshData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to log");
    } finally {
      setLoggingId(null);
    }
  };

  const handleQuickLog = async (item: TodayScheduleItem, status: "taken" | "missed") => {
    setLoggingId(item.key);
    try {
      await createMedicationLog({
        medication: item.medicationId,
        taken: status === "taken",
        status,
        scheduledTime: item.scheduledTime,
      });
      message.success(`Marked as ${status}`);
      refreshData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to log");
    } finally {
      setLoggingId(null);
    }
  };

  const columns = [
    {
      title: "Medication",
      key: "medication",
      render: (_: unknown, record: MedicationLog) => (
        <Text strong>{getMedicationName(record.medication)}</Text>
      ),
    },
    {
      title: "Scheduled",
      dataIndex: "scheduledTime",
      key: "scheduledTime",
      render: (t: string) => t || "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string, record: MedicationLog) => (
        <Tag icon={statusIcons[s]} color={statusColors[s]} style={{ textTransform: "capitalize" }}>
          {s}{record.taken !== undefined ? ` (${record.taken ? "taken" : "not taken"})` : ""}
        </Tag>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
      sorter: (a: MedicationLog, b: MedicationLog) => (a.date || "").localeCompare(b.date || ""),
    },
    {
      title: "Logged At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d: string) =>
        d ? (
          <Text style={{ whiteSpace: "nowrap" }}>{dayjs(d).format("MMM D, YYYY h:mm A")}</Text>
        ) : (
          "-"
        ),
      sorter: (a: MedicationLog, b: MedicationLog) => (a.createdAt || "").localeCompare(b.createdAt || ""),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      ellipsis: true,
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: MedicationLog) => (
        <Space size={0}>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditLog(record)}
            style={{ fontSize: 14 }}
          />
          <Popconfirm title="Delete this log entry?" onConfirm={() => handleDelete(record._id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const todayColumns = [
    {
      title: "Medication",
      key: "medication",
      render: (_: unknown, record: TodayScheduleItem) => (
        <Text strong>
          {record.medicationName}
          {record.dosage ? <Text type="secondary"> ({record.dosage})</Text> : null}
        </Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (d: string) => (d ? dayjs(d).format("MMM D") : dayjs().format("MMM D")),
    },
    {
      title: "Scheduled",
      dataIndex: "scheduledTime",
      key: "scheduledTime",
      render: (t: string, record: TodayScheduleItem) => (
        <Space>
          <Text>{t}</Text>
          {record.minutesOverdue !== undefined && record.minutesOverdue > 0 && (
            <Text type="danger" style={{ fontSize: 12 }}>({record.minutesOverdue} min overdue)</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag icon={statusIcons[s]} color={statusColors[s]} style={{ textTransform: "capitalize" }}>
          {s}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: unknown, record: TodayScheduleItem) => {
        if (record.status === "due") {
          return (
            <Space size={4}>
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={loggingId === record.key}
                onClick={() => handleQuickLog(record, "taken")}
                style={{ fontSize: 12 }}
              >
                Taken
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                loading={loggingId === record.key}
                onClick={() => handleQuickLog(record, "missed")}
                style={{ fontSize: 12 }}
              >
                Missed
              </Button>
            </Space>
          );
        }
        if (record.status === "missed") {
          return (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loggingId === record.key}
              onClick={() => handleQuickLog(record, "taken")}
              style={{ fontSize: 12 }}
            >
              Take Now
            </Button>
          );
        }
        return null;
      },
    },
  ];

  const missedColumns = [
    {
      title: "Medication",
      key: "medication",
      render: (_: unknown, record: ReminderItem) => (
        <Text strong>
          {record.medication.medicineName}
          {record.medication.dosage ? <Text type="secondary"> ({record.medication.dosage})</Text> : null}
        </Text>
      ),
    },
    {
      title: "Scheduled",
      key: "scheduledTime",
      render: (_: unknown, record: ReminderItem) => (
        <Space>
          <Text>{record.scheduledTime}</Text>
          {record.status === "due" && record.minutesOverdue !== undefined && record.minutesOverdue > 0 && (
            <Text type="warning" style={{ fontSize: 12 }}>({record.minutesOverdue} min overdue)</Text>
          )}
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <Tag icon={statusIcons[s] || <ExclamationCircleOutlined />} color={statusColors[s] || "red"} style={{ textTransform: "capitalize" }}>
          {s === "due" ? "Due (grace period)" : "Missed"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: unknown, record: ReminderItem) => {
        const id = `${record.status}-${record.medication._id}-${record.date}-${record.scheduledTime}`;
        return (
          <Space>
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={loggingId === id}
              onClick={() => handleMissedLog(record)}
              style={{ fontSize: 12 }}
            >
              I actually took it
            </Button>
            <Button
              size="small"
              icon={<CloseCircleOutlined />}
              loading={loggingId === id}
              onClick={() => openLog({ status: "missed", date: dayjs(record.date), medicationId: record.medication._id, scheduledTime: record.scheduledTime })}
              style={{ fontSize: 12 }}
            >
              Keep Missed
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>Medication Logs</Title>
        <Space wrap>
          <Segmented
            value={view}
            onChange={(v) => setView(v as "today" | "history" | "missed")}
            options={[
              { label: "Today", value: "today" },
              { label: "History", value: "history", icon: <HistoryOutlined /> },
              { label: "Missed", value: "missed", icon: <ExclamationCircleOutlined /> },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openLog()}>
            Log Medication
          </Button>
        </Space>
      </div>

      {view === "today" && schedule.length === 0 && (
        <Alert
          title="All caught up!"
          description="No medications due right now. All scheduled medications for today have been taken. Use the Missed tab to log past doses."
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
        />
      )}

      {view === "history" && (
        <div style={{ marginBottom: 16, padding: "8px 0" }}>
          <Space wrap>
            <DatePicker
              placeholder="From date"
              value={historyDateRange?.[0] ?? null}
              onChange={(d) => setHistoryDateRange((prev) => [d, prev?.[1] ?? null])}
              allowClear
            />
            <DatePicker
              placeholder="To date"
              value={historyDateRange?.[1] ?? null}
              onChange={(d) => setHistoryDateRange((prev) => [prev?.[0] ?? null, d])}
              allowClear
            />
            <Button size="small" onClick={() => { setHistoryDateRange(null); refreshData(); }}>
              Clear
            </Button>
          </Space>
        </div>
      )}

      {view === "missed" && (
        <div style={{ marginBottom: 16, padding: "8px 0" }}>
          <Space wrap>
            <DatePicker
              placeholder="From"
              value={missedDateRange[0]}
              onChange={(d) => d && setMissedDateRange((prev) => [d, prev[1]])}
            />
            <DatePicker
              placeholder="To"
              value={missedDateRange[1]}
              onChange={(d) => d && setMissedDateRange((prev) => [prev[0], d])}
            />
            <Button size="small" type="primary" onClick={() => refreshData()}>
              Search
            </Button>
            <Button size="small" onClick={() => setMissedDateRange([dayjs().subtract(7, "day"), dayjs()])}>
              Last 7 days
            </Button>
          </Space>
        </div>
      )}

      {view === "today" ? (
        <Table
          dataSource={schedule}
          columns={todayColumns}
          rowKey="key"
          loading={loading}
          pagination={false}
        />
      ) : view === "missed" ? (
        <div>
          {dueReminders.length > 0 && (
            <>
              <div style={{ marginBottom: 8 }}>
                <Tag color="gold" style={{ fontSize: 13, padding: "2px 8px" }}>{dueReminders.length} due (within grace period)</Tag>
              </div>
              <Table
                dataSource={dueReminders.map((r) => ({ ...r, key: `due-${r.medication._id}-${r.date}-${r.scheduledTime}` }))}
                columns={missedColumns}
                rowKey="key"
                loading={loading}
                pagination={false}
                style={{ marginBottom: 24 }}
                size="small"
              />
            </>
          )}
          {missedReminders.length > 0 ? (
            <>
              <div style={{ marginBottom: 8 }}>
                <Tag color="red" style={{ fontSize: 13, padding: "2px 8px" }}>{missedReminders.length} missed (past grace period)</Tag>
              </div>
              <Table
                dataSource={missedReminders.map((r) => ({ ...r, key: `missed-${r.medication._id}-${r.date}-${r.scheduledTime}` }))}
                columns={missedColumns}
                rowKey="key"
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
                size="small"
              />
            </>
          ) : (
            dueReminders.length === 0 && (
              <Alert
                title="No missed doses"
                description="All medications have been logged for the selected date range."
                type="success"
                showIcon
                style={{ borderRadius: 12 }}
              />
            )
          )}
        </div>
      ) : (
        <Table
          dataSource={logs}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      )}

      <Modal
        title={editingLog ? "Edit Medication Log" : "Log Medication"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnHidden
        afterClose={() => { setInitialFormValues(undefined); form.resetFields(); }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={initialFormValues || { date: dayjs(), taken: true }}
          style={{ marginTop: 16 }}
        >
          {!editingLog && (
            <Form.Item
              name="medication"
              label="Medication"
              rules={[{ required: true, message: "Select a medication" }]}
            >
              <Select
                placeholder="Select medication"
                options={medications.map((m) => ({
                  value: m._id,
                  label: `${m.medicineName} (${m.dosage})`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Select status" }]}
          >
            <Select
              placeholder="Taken, missed, or skipped?"
              options={[
                { value: "taken", label: "Taken" },
                { value: "missed", label: "Missed" },
                { value: "skipped", label: "Skipped (doctor advised)" },
              ]}
            />
          </Form.Item>

          <Form.Item name="taken" label="Taken?" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>

          <Form.Item name="scheduledTime" label="Scheduled Time">
            <Select
              placeholder="Select scheduled time (optional)"
              allowClear
              options={Array.from({ length: 48 }, (_, i) => {
                const h = Math.floor(i / 2);
                const m = i % 2 === 0 ? "00" : "30";
                const t = `${String(h).padStart(2, "0")}:${m}`;
                return { value: t, label: t };
              })}
            />
          </Form.Item>

          <Form.Item name="date" label="Date">
            <Space orientation="vertical" style={{ width: "100%" }}>
              <DatePicker style={{ width: "100%" }} />
              <Space>
                <Text type="secondary" style={{ fontSize: 12 }}>Quick set:</Text>
                <Button size="small" type="link" onClick={() => setDateOnForm(dayjs())} style={{ fontSize: 12 }}>
                  Today
                </Button>
                <Button size="small" type="link" onClick={() => setDateOnForm(dayjs().subtract(1, "day"))} style={{ fontSize: 12 }}>
                  Yesterday
                </Button>
                <Button size="small" type="link" onClick={() => setDateOnForm(dayjs().subtract(2, "day"))} style={{ fontSize: 12 }}>
                  2 days ago
                </Button>
                <Button size="small" type="link" onClick={() => setDateOnForm(dayjs().subtract(7, "day"))} style={{ fontSize: 12 }}>
                  Last week
                </Button>
              </Space>
            </Space>
          </Form.Item>

          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={2} placeholder="Why was it missed? Any additional info..." />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {editingLog ? "Update Log" : "Save Log"}
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
}
