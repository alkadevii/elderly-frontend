"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Card,
  Space,
  Typography,
  Tag,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  CalendarOutlined,
  EditOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Appointment, AppointmentFormData } from "@/types/Appointment";
import type { Hospital } from "@/types/Hospital";
import type { AppointmentStatus } from "@/types/Appointment";
import {
  getAppointments,
  createAppointment,
  confirmAppointment,
  submitFeedback,
  cancelAppointment,
} from "@/services/appointmentService";
import { getHospitals } from "@/services/hospitalService";
import { colors } from "@/styles/theme";

const { Title, Paragraph, Text } = Typography;

const statusColors: Record<string, string> = {
  pending: "blue",
  pending_confirmation: "red",
  user_confirmed: "purple",
  approved: "green",
  scheduled: "cyan",
  awaiting_feedback: "orange",
  feedback_provided: "geekblue",
  completed: "default",
  cancelled: "red",
  rejected: "red",
  cancellation_requested: "volcano",
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const canCancel = (status: string, appointmentDate: string) => {
  const cancelable = ["scheduled", "pending", "user_confirmed", "pending_confirmation"];
  if (!cancelable.includes(status)) return false;
  const hoursUntil = dayjs(appointmentDate).diff(dayjs(), "hour");
  return hoursUntil >= 24;
};

export default function AppointmentSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelAppt, setCancelAppt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchHospitals = async () => {
    try {
      const res = await getHospitals(true);
      const list = Array.isArray(res) ? res : (res.data || res.hospitals || []);
      setHospitals(list.filter((h: Hospital) => h.isActive));
    } catch (err) {
      console.error("Failed to load hospitals", err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAppointments();
      const list = Array.isArray(res) ? res : (res.data || res.appointments || []);
      setAppointments(list);
    } catch (err) {
      console.error("Failed to load appointments", err);
      message.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [appRes, hospRes] = await Promise.all([getAppointments(), getHospitals(true)]);
        if (!cancelled) {
          const appList = Array.isArray(appRes) ? appRes : (appRes.data || appRes.appointments || []);
          const hospList = Array.isArray(hospRes) ? hospRes : (hospRes.data || hospRes.hospitals || []);
          setAppointments(appList);
          setHospitals(hospList.filter((h: Hospital) => h.isActive));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load appointments", err);
          message.error("Failed to load appointments");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();

    const interval = setInterval(async () => {
      if (cancelled) return;
      try {
        const res = await getAppointments();
        if (!cancelled) {
          const list = Array.isArray(res) ? res : (res.data || res.appointments || []);
          setAppointments(list);
        }
      } catch {
      }
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const openAdd = () => {
    fetchHospitals();
    setModalOpen(true);
  };

  const handleConfirm = async (
    id: string,
    status: "confirmed" | "declined",
    notes?: string
  ) => {
    try {
      await confirmAppointment(id, { status, confirmationNotes: notes });
      message.success(
        status === "confirmed"
          ? "Appointment confirmed - staff will call the hospital to finalize"
          : "Appointment declined"
      );
      fetchData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to update appointment");
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload: AppointmentFormData = {
        doctorName: values.doctorName as string,
        hospital: values.hospital as string,
        appointmentDate: values.appointmentDate
          ? dayjs(values.appointmentDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : "",
        reason: values.reason as string,
      };

      await createAppointment(payload);
      message.success("Appointment submitted for review");

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save appointment", err);
      message.error((err as Error)?.message || "Failed to save appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async (values: Record<string, unknown>) => {
    if (!feedbackAppointment) return;
    setSubmitting(true);
    try {
      await submitFeedback(feedbackAppointment._id, {
        feedbackNotes: values.feedbackNotes as string,
      });
      message.success("Feedback submitted. Thank you!");
      setFeedbackModalOpen(false);
      setFeedbackAppointment(null);
      fetchData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelAppt) return;
    setSubmitting(true);
    try {
      await cancelAppointment(cancelAppt._id, {
        reason: cancelReason || undefined,
      });
      message.success("Cancellation requested. Staff will review.");
      setCancelModalOpen(false);
      setCancelAppt(null);
      setCancelReason("");
      fetchData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to request cancellation");
    } finally {
      setSubmitting(false);
    }
  };

  const openCancelModal = (appt: Appointment) => {
    setCancelAppt(appt);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const columns = [
    {
      title: "Doctor",
      dataIndex: "doctorName",
      key: "doctorName",
      render: (name: string) => <strong>{name}</strong>,
    },
    {
      title: "Hospital",
      dataIndex: "hospital",
      key: "hospital",
      render: (v: string) => v || "-",
    },
    {
      title: "Date",
      dataIndex: "appointmentDate",
      key: "appointmentDate",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: AppointmentStatus) => (
        <Tag style={{ textTransform: "capitalize" }} color={statusColors[s] || "default"}>
          {formatStatus(s)}
        </Tag>
      ),
    },
    {
      title: "Notes",
      key: "notes",
      width: 220,
      render: (_: unknown, record: Appointment) => {
        const notes: string[] = [];
        if (record.tokenNumber) notes.push(`Token: ${record.tokenNumber}`);
        if (record.finalNotes) notes.push(record.finalNotes);
        if (record.reviewNotes) notes.push(record.reviewNotes);
        if (record.confirmationNotes) notes.push(`You: ${record.confirmationNotes}`);
        if (record.feedbackNotes) notes.push(`Feedback: ${record.feedbackNotes}`);
        if (record.cancelledBy) notes.push(`Cancelled by: ${record.cancelledBy}`);
        if (notes.length === 0) return <span style={{ color: colors.textSecondary }}>-</span>;
        return (
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            {notes.map((n, i) => (
              <div key={i} style={{ marginBottom: i < notes.length - 1 ? 4 : 0 }}>{n}</div>
            ))}
          </div>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Appointment) => {
        if (canCancel(record.status, record.appointmentDate)) {
          return (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => openCancelModal(record)}
            >
              Cancel
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <Row gutter={20} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic
              title="Total"
              value={appointments.length}
              prefix={<CalendarOutlined />}
              styles={{ content: { color: colors.primary } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic
              title="Pending"
              value={appointments.filter((a) => a.status === "pending").length}
              styles={{ content: { color: "#f59e0b" } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic
              title="Scheduled"
              value={appointments.filter((a) => a.status === "scheduled").length}
              styles={{ content: { color: "#0891b2" } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic
              title="Completed"
              value={appointments.filter((a) => a.status === "completed").length}
              styles={{ content: { color: "#10b981" } }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>Appointments</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Request Appointment
          </Button>
        </div>

        {appointments
          .filter((a) => a.status === "pending_confirmation")
          .map((appt) => (
            <Card
              key={appt._id}
              size="small"
              style={{
                marginBottom: 16,
                borderRadius: 12,
                border: "1px solid #ef4444",
                background: "#fef2f2",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Title level={5} style={{ color: "#ef4444", marginBottom: 4 }}>
                    Staff proposed a new appointment
                  </Title>
                  {appt.proposedBy && (
                    <Paragraph style={{ marginBottom: 4, color: colors.textSecondary, fontSize: 13 }}>
                      Proposed by {appt.proposedBy.name}
                    </Paragraph>
                  )}
                  <Paragraph strong style={{ marginBottom: 2 }}>
                    {appt.doctorName}
                    {appt.hospital ? ` — ${appt.hospital}` : ""}
                  </Paragraph>
                  <Paragraph style={{ marginBottom: 4, color: colors.textSecondary, fontSize: 13 }}>
                    {appt.appointmentDate ? dayjs(appt.appointmentDate).format("MMM D, YYYY") : "-"}
                  </Paragraph>
                  {appt.reviewNotes && (
                    <Paragraph style={{ marginBottom: 0, fontStyle: "italic" }}>
                      “{appt.reviewNotes}”
                    </Paragraph>
                  )}
                </div>
                <Space>
                  <Button
                    type="primary"
                    onClick={() => handleConfirm(appt._id, "confirmed")}
                  >
                    Accept
                  </Button>
                  <Button
                    danger
                    onClick={() => handleConfirm(appt._id, "declined")}
                  >
                    Decline
                  </Button>
                </Space>
              </div>
            </Card>
          ))}

          {appointments
          .filter((a) => a.status === "user_confirmed")
          .map((appt) => (
            <Card
              key={appt._id}
              size="small"
              style={{
                marginBottom: 16,
                borderRadius: 12,
                border: "1px solid #7c3aed",
                background: "#f5f3ff",
              }}
            >
              <Title level={5} style={{ color: "#6d28d9", marginBottom: 4 }}>
                Waiting for staff to confirm with hospital
              </Title>
              <Paragraph style={{ marginBottom: 0, color: colors.textSecondary, fontSize: 13 }}>
                You accepted the proposed slot for {appt.doctorName}
                {appt.hospital ? ` at ${appt.hospital}` : ""}. A staff member will
                call the hospital to book and get a token number.
              </Paragraph>
            </Card>
          ))}

        {appointments
          .filter((a) => a.status === "awaiting_feedback")
          .map((appt) => (
            <Card
              key={appt._id}
              size="small"
              style={{
                marginBottom: 16,
                borderRadius: 12,
                border: "1px solid #d97706",
                background: "#fffbeb",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <Title level={5} style={{ color: "#d97706", marginBottom: 4 }}>
                    How was your visit?
                  </Title>
                  <Paragraph style={{ marginBottom: 0, color: colors.textSecondary, fontSize: 13 }}>
                    {appt.doctorName}{appt.hospital ? ` at ${appt.hospital}` : ""}
                  </Paragraph>
                </div>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setFeedbackAppointment(appt);
                    setFeedbackModalOpen(true);
                  }}
                >
                  Share Feedback
                </Button>
              </div>
            </Card>
          ))}

        <Table
          dataSource={appointments}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={appointments.length > 10 ? { pageSize: 10, showSizeChanger: true, showTotal: (total) => `${total} appointments` } : false}
        />
      </Card>

      {modalOpen && (
        <Modal
          title="Request Appointment"
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          confirmLoading={submitting}
          footer={null}
        >
          <Form
            layout="vertical"
            onFinish={handleSubmit}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="doctorName" label="Doctor Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Dr. Smith" />
            </Form.Item>
            <Form.Item name="hospital" label="Hospital / Clinic">
              <Select
                placeholder="Select a hospital"
                allowClear
                showSearch
                optionFilterProp="label"
                notFoundContent={hospitals.length === 0 ? "No hospitals available" : "No matches"}
                options={hospitals.map((h) => ({
                  value: h.name,
                  label: h.address ? `${h.name} — ${h.address}` : h.name,
                }))}
              />
            </Form.Item>
            <Form.Item name="appointmentDate" label="Appointment Date" rules={[{ required: true, message: "Required" }]}>
              <DatePicker
                style={{ width: "100%" }}
                disabledDate={(current) => !!current && current < dayjs().endOf("day")}
              />
            </Form.Item>
            <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Required" }]}>
              <Input.TextArea rows={3} placeholder="Describe the reason for your visit" />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit Request
              </Button>
            </div>
          </Form>
        </Modal>
      )}

      <Modal
        title="Share Visit Feedback"
        open={feedbackModalOpen}
        onCancel={() => {
          setFeedbackModalOpen(false);
          setFeedbackAppointment(null);
        }}
        footer={null}
      >
        {feedbackAppointment && (
          <Form
            layout="vertical"
            onFinish={handleFeedback}
            style={{ marginTop: 16 }}
          >
            <Paragraph style={{ color: colors.textSecondary, marginBottom: 16 }}>
              How was your visit with <strong>{feedbackAppointment.doctorName}</strong>
              {feedbackAppointment.hospital ? ` at ${feedbackAppointment.hospital}` : ""}?
            </Paragraph>
            <Form.Item
              name="feedbackNotes"
              label="Your Notes"
              rules={[{ required: true, message: "Please share your experience" }]}
            >
              <Input.TextArea
                rows={4}
                placeholder="Describe how the visit went, any follow-up instructions, or concerns..."
              />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button
                onClick={() => {
                  setFeedbackModalOpen(false);
                  setFeedbackAppointment(null);
                }}
              >
                Skip
              </Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Submit Feedback
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      <Modal
        title="Cancel Appointment"
        open={cancelModalOpen}
        onCancel={() => {
          setCancelModalOpen(false);
          setCancelAppt(null);
          setCancelReason("");
        }}
        onOk={handleCancelRequest}
        confirmLoading={submitting}
        okText="Request Cancellation"
        okButtonProps={{ danger: true }}
      >
        {cancelAppt && (
          <div>
            <Paragraph>
              You are requesting to cancel your appointment with{" "}
              <strong>{cancelAppt.doctorName}</strong>
              {cancelAppt.hospital ? ` at ${cancelAppt.hospital}` : ""} on{" "}
              {dayjs(cancelAppt.appointmentDate).format("MMM D, YYYY")}.
            </Paragraph>
            {!canCancel(cancelAppt.status, cancelAppt.appointmentDate) && (
              <Paragraph style={{ color: "#ef4444" }}>
                Cancellation requires at least 24 hours notice. This request may be rejected.
              </Paragraph>
            )}
            <Form.Item label="Reason (optional)">
              <Input.TextArea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Why do you want to cancel?"
              />
            </Form.Item>
          </div>
        )}
      </Modal>
    </div>
  );
}
