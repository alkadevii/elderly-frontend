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
  Popconfirm,
  message,
  Card,
  Space,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { Appointment, AppointmentFormData } from "@/types/Appointment";
import {
  getAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "@/services/appointmentService";

const { Title } = Typography;

export default function AppointmentSection() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        const res = await getAppointments();
        if (!cancelled) {
          const list = Array.isArray(res) ? res : (res.data || res.appointments || []);
          setAppointments(list);
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
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => {
    setEditingAppointment(null);
    setModalOpen(true);
  };

  const openEdit = (record: Appointment) => {
    setEditingAppointment(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAppointment(id);
      message.success("Appointment deleted");
      fetchData();
    } catch {
      message.error("Failed to delete appointment");
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload: AppointmentFormData = {
        doctorName: values.doctorName as string,
        date: values.date ? dayjs(values.date as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD") : "",
        time: values.time as string,
        reason: values.reason as string,
        status: values.status as "scheduled" | "completed" | "cancelled",
        notes: values.notes as string,
      };

      if (editingAppointment) {
        await updateAppointment(editingAppointment._id, payload);
        message.success("Appointment updated");
      } else {
        await createAppointment(payload);
        message.success("Appointment created");
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save appointment", err);
      message.error("Failed to save appointment");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
    { title: "Date", dataIndex: "date", key: "date", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
    { title: "Time", dataIndex: "time", key: "time" },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s: string) => (
        <span style={{ textTransform: "capitalize" }}>{s}</span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
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
      date: editingAppointment.date ? dayjs(editingAppointment.date) : undefined,
    };
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Appointments</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Add Appointment
        </Button>
      </div>

      <Table
        dataSource={appointments}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {modalOpen && (
        <Modal
          title={editingAppointment ? "Edit Appointment" : "Add Appointment"}
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
            <Form.Item name="date" label="Date" rules={[{ required: true, message: "Required" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="time" label="Time" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="10:00 AM" />
            </Form.Item>
            <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Regular checkup" />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true, message: "Required" }]}>
              <Select>
                <Select.Option value="scheduled">Scheduled</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="cancelled">Cancelled</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingAppointment ? "Update" : "Create"}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Card>
  );
}
