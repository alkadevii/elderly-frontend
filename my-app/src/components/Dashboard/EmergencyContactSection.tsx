"use client";

import { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
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
import type { EmergencyContact, EmergencyContactFormData } from "@/types/EmergencyContact";
import {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} from "@/services/emergencyContactService";

const { Title } = Typography;

export default function EmergencyContactSection() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getEmergencyContacts();
      const list = Array.isArray(res) ? res : (res.data || res.contacts || []);
      setContacts(list);
    } catch (err) {
      console.error("Failed to load contacts", err);
      message.error("Failed to load contacts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const res = await getEmergencyContacts();
        if (!cancelled) {
          const list = Array.isArray(res) ? res : (res.data || res.contacts || []);
          setContacts(list);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load contacts", err);
          message.error("Failed to load contacts");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const openAdd = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const openEdit = (record: EmergencyContact) => {
    setEditingContact(record);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEmergencyContact(id);
      message.success("Contact deleted");
      fetchData();
    } catch {
      message.error("Failed to delete contact");
    }
  };

  const handleSubmit = async (values: EmergencyContactFormData) => {
    setSubmitting(true);
    try {
      if (editingContact) {
        await updateEmergencyContact(editingContact._id, values);
        message.success("Contact updated");
      } else {
        await createEmergencyContact(values);
        message.success("Contact created");
      }

      setModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save contact", err);
      message.error("Failed to save contact");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Relationship", dataIndex: "relationship", key: "relationship" },
    { title: "Phone", dataIndex: "phone", key: "phone" },
    { title: "Email", dataIndex: "email", key: "email", render: (v: string) => v || "-" },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: EmergencyContact) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          />
          <Popconfirm
            title="Delete this contact?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Emergency Contacts</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Add Contact
        </Button>
      </div>

      <Table
        dataSource={contacts}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      {modalOpen && (
        <Modal
          title={editingContact ? "Edit Contact" : "Add Contact"}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          confirmLoading={submitting}
          footer={null}
        >
          <Form
            layout="vertical"
            initialValues={editingContact || undefined}
            onFinish={handleSubmit}
            style={{ marginTop: 16 }}
          >
            <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="John Doe" />
            </Form.Item>
            <Form.Item name="relationship" label="Relationship" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="Son / Daughter / Friend" />
            </Form.Item>
            <Form.Item name="phone" label="Phone" rules={[{ required: true, message: "Required" }]}>
              <Input placeholder="+1 234 567 890" />
            </Form.Item>
            <Form.Item name="email" label="Email">
              <Input placeholder="email@example.com" />
            </Form.Item>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <Button onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                {editingContact ? "Update" : "Create"}
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </Card>
  );
}
