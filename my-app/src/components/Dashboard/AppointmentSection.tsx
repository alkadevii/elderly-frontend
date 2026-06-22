"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Popconfirm,
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
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Appointment, AppointmentFormData } from "@/types/Appointment";
import type { Hospital } from "@/types/Hospital";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  confirmAppointment,
} from "@/services/appointmentService";
import { getHospitals } from "@/services/hospitalService";
import { colors } from "@/styles/theme";
import type { AppointmentStatus } from "@/types/Appointment";
import { notifyAppointmentChanges } from "@/utils/appointmentNotifications";

const { Title, Paragraph } = Typography;

const statusColors: Record<AppointmentStatus, string> = {
  pending: "blue",
  pending_confirmation: "orange",
  user_confirmed: "purple",
  approved: "green",
  scheduled: "cyan",
  completed: "default",
  cancelled: "red",
  rejected: "red",
};

const formatStatus = (s: AppointmentStatus) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AppointmentSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const prevAppointmentsRef = useRef<Appointment[]>([]);

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
      prevAppointmentsRef.current = list;
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
          prevAppointmentsRef.current = appList;
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
          notifyAppointmentChanges(prevAppointmentsRef.current, list, "user");
          prevAppointmentsRef.current = list;
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
    setEditingAppointment(null);
    fetchHospitals();
    setModalOpen(true);
  };

  const openEdit = (record: Appointment) => {
    setEditingAppointment(record);
    fetchHospitals();
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      message.success("Appointment deleted");
      fetchData();
    } catch (err) {
      message.error((err as Error)?.message || "Failed to delete appointment");
    }
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

      if (editingAppointment) {
        await updateAppointment(editingAppointment._id, payload);
        message.success("Appointment updated");
      } else {
        await createAppointment(payload);
        message.success("Appointment submitted for review");
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save appointment", err);
      message.error((err as Error)?.message || "Failed to save appointment");
    } finally {
      setSubmitting(false);
    }
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
      render: (_: unknown, record: Appointment) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this appointment?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getInitialValues = () => {
    if (!editingAppointment) return undefined;
    return {
      ...editingAppointment,
      appointmentDate: editingAppointment.appointmentDate
        ? dayjs(editingAppointment.appointmentDate)
        : undefined,
    };
  };

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
                border: "1px solid #f59e0b",
                background: "#fff7e6",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <Title level={5} style={{ color: "#d97706", marginBottom: 4 }}>
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
          title={editingAppointment ? "Edit Appointment" : "Request Appointment"}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          confirmLoading={submitting}
          footer={null}
        >
          <Form
            layout="vertical"
            initialValues={getInitialValues()}
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
                {editingAppointment ? "Update" : "Submit Request"}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
