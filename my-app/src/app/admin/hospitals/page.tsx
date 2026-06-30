"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { Hospital, HospitalFormData } from "@/types/Hospital";
import { getHospitals, createHospital, updateHospital, deleteHospital } from "@/services/hospitalService";
import PhoneInput from "@/components/common/PhoneInput";

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [form] = Form.useForm();

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const res = await getHospitals(true);
      setHospitals(Array.isArray(res) ? res : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleSubmit = async (values: HospitalFormData) => {
    try {
      if (editingHospital) {
        await updateHospital(editingHospital._id, values);
        message.success("Hospital updated");
      } else {
        await createHospital(values);
        message.success("Hospital added");
      }
      setModalOpen(false);
      form.resetFields();
      fetchHospitals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save hospital";
      message.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHospital(id);
      message.success("Hospital deleted");
      fetchHospitals();
    } catch {
      message.error("Failed to delete hospital");
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Address", dataIndex: "address", key: "address", render: (v: string) => v || "-" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
    { title: "Email", dataIndex: "email", key: "email", render: (v: string) => v || "-" },
    {
      title: "Active",
      dataIndex: "isActive",
      key: "isActive",
      render: (a: boolean) =>
        a ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_: unknown, record: Hospital) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => {
            setEditingHospital(record);
            form.setFieldsValue(record);
            setModalOpen(true);
          }} />
          <Popconfirm title="Delete this hospital?" onConfirm={() => handleDelete(record._id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {
          setEditingHospital(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          Add Hospital
        </Button>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Table dataSource={hospitals} columns={columns} rowKey="_id" loading={loading} scroll={{ x: 'max-content' }} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={editingHospital ? "Edit Hospital" : "Add Hospital"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
          initialValues={{ isActive: true }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Hospital name" />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="Address" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <PhoneInput placeholder="Hospital phone" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingHospital ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
