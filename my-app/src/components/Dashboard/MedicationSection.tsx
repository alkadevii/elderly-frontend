"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
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
import type { Medication, MedicationFormData } from "@/types/Medication";
import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from "@/services/medicationService";

const { Title } = Typography;

export default function MedicationSection() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMedications();
      const list = Array.isArray(res) ? res : (res.data || res.medications || []);
      setMedications(list);
    } catch (err) {
      console.error("Failed to load medications", err);
      message.error("Failed to load medications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMedications();
        if (!cancelled) {
          const list = Array.isArray(res) ? res : (res.data || res.medications || []);
          setMedications(list);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load medications", err);
          message.error("Failed to load medications");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => {
    setEditingMedication(null);
    setModalOpen(true);
  };

  const openEdit = (record: Medication) => {
    setEditingMedication(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedication(id);
      message.success("Medication deleted");
      fetchData();
    } catch {
      message.error("Failed to delete medication");
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload: MedicationFormData = {
        medicineName: values.medicineName as string,
        dosage: values.dosage as string,
        frequency: values.frequency as string,
        startDate: values.startDate
          ? dayjs(values.startDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : "",
        endDate: values.endDate
          ? dayjs(values.endDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : undefined,
      };

      if (editingMedication) {
        await updateMedication(editingMedication._id, payload);
        message.success("Medication updated");
      } else {
        await createMedication(payload);
        message.success("Medication created");
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save medication", err);
      message.error("Failed to save medication");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Medicine Name",
      dataIndex: "medicineName",
      key: "medicineName",
      render: (name: string) => <strong>{name}</strong>,
    },
    { title: "Dosage", dataIndex: "dosage", key: "dosage" },
    { title: "Frequency", dataIndex: "frequency", key: "frequency" },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Medication) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this medication?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getInitialValues = () => {
    if (!editingMedication) return undefined;
    return {
      ...editingMedication,
      startDate: editingMedication.startDate ? dayjs(editingMedication.startDate) : undefined,
      endDate: editingMedication.endDate ? dayjs(editingMedication.endDate) : undefined,
    };
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Medications</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Add Medication
        </Button>
      </div>

      <Table
        dataSource={medications}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      {modalOpen && (
        <Modal
          title={editingMedication ? "Edit Medication" : "Add Medication"}
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
            <Form.Item name="medicineName" label="Medicine Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Aspirin / Metformin" />
            </Form.Item>
            <Form.Item name="dosage" label="Dosage" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="500mg / 2 tablets" />
            </Form.Item>
            <Form.Item name="frequency" label="Frequency" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Twice daily / Once daily" />
            </Form.Item>
            <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: "Required" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="endDate" label="End Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingMedication ? "Update" : "Create"}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Card>
  );
}
