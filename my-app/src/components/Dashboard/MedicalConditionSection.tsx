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
import type { MedicalCondition, MedicalConditionFormData } from "@/types/MedicalCondition";
import {
  getMedicalConditions,
  createMedicalCondition,
  updateMedicalCondition,
  deleteMedicalCondition,
} from "@/services/medicalConditionService";

const { Title } = Typography;

export default function MedicalConditionSection() {
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<MedicalCondition | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMedicalConditions();
      const list = Array.isArray(res) ? res : (res.data || res.conditions || []);
      setConditions(list);
    } catch (err) {
      console.error("Failed to load medical conditions", err);
      message.error("Failed to load medical conditions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getMedicalConditions();
        if (!cancelled) {
          const list = Array.isArray(res) ? res : (res.data || res.conditions || []);
          setConditions(list);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load medical conditions", err);
          message.error("Failed to load medical conditions");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => {
    setEditingCondition(null);
    setModalOpen(true);
  };

  const openEdit = (record: MedicalCondition) => {
    setEditingCondition(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedicalCondition(id);
      message.success("Condition deleted");
      fetchData();
    } catch {
      message.error("Failed to delete condition");
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    setSubmitting(true);
    try {
      const payload: MedicalConditionFormData = {
        conditionName: values.conditionName as string,
        diagnosedDate: values.diagnosedDate
          ? dayjs(values.diagnosedDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : undefined,
        severity: values.severity as "mild" | "moderate" | "severe",
        notes: values.notes as string,
      };

      if (editingCondition) {
        await updateMedicalCondition(editingCondition._id, payload);
        message.success("Condition updated");
      } else {
        await createMedicalCondition(payload);
        message.success("Condition created");
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save condition", err);
      message.error("Failed to save condition");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "Condition", dataIndex: "conditionName", key: "conditionName" },
    {
      title: "Diagnosed",
      dataIndex: "diagnosedDate",
      key: "diagnosedDate",
      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (s: string) => (
        <span style={{ textTransform: "capitalize" }}>{s}</span>
      ),
    },
    { title: "Notes", dataIndex: "notes", key: "notes", render: (v: string) => v || "-" },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: MedicalCondition) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this condition?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getInitialValues = () => {
    if (!editingCondition) return undefined;
    return {
      ...editingCondition,
      diagnosedDate: editingCondition.diagnosedDate ? dayjs(editingCondition.diagnosedDate) : undefined,
    };
  };

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Medical Conditions</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Add Condition
        </Button>
      </div>

      <Table
        dataSource={conditions}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {modalOpen && (
        <Modal
          title={editingCondition ? "Edit Condition" : "Add Condition"}
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
            <Form.Item name="conditionName" label="Condition Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Diabetes / Hypertension" />
            </Form.Item>
            <Form.Item name="diagnosedDate" label="Diagnosed Date">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="severity" label="Severity" rules={[{ required: true, message: "Required" }]}>
              <Select>
                <Select.Option value="mild">Mild</Select.Option>
                <Select.Option value="moderate">Moderate</Select.Option>
                <Select.Option value="severe">Severe</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingCondition ? "Update" : "Create"}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Card>
  );
}
