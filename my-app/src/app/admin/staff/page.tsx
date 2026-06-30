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
  Avatar,
  Typography,
  message,
  Select,
} from "antd";
import {
  UserAddOutlined,
  UserOutlined,
  EyeOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { colors } from "@/styles/theme";
import type { User } from "@/types/User";
import { getStaff, createStaff, getUsers } from "@/services/adminService";

const { Title, Paragraph } = Typography;

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm] = Form.useForm();

  const [staffViewModalOpen, setStaffViewModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<User | null>(null);

  const regularUsers = users.filter((u) => u.role === "user" || !u.role);

  const getUsersForStaff = (staffId: string) =>
    regularUsers.filter((u) => u.assignedStaff?._id === staffId);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [staffRes, usersRes] = await Promise.all([getStaff(), getUsers()]);
        if (!cancelled) {
          setStaffList(Array.isArray(staffRes) ? staffRes : []);
          setUsers(Array.isArray(usersRes) ? usersRes : []);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleCreateStaff = async (values: { name: string; email: string; password: string }) => {
    try {
      await createStaff(values);
      message.success("Staff account created");
      setStaffModalOpen(false);
      staffForm.resetFields();
      const res = await getStaff();
      setStaffList(Array.isArray(res) ? res : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create staff";
      message.error(msg);
    }
  };

  const columns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
    {
      title: "Assigned Users",
      key: "assignedCount",
      render: (_: unknown, record: User) => {
        const count = getUsersForStaff(record._id || record.id || "").length;
        return <Tag color={count > 0 ? "blue" : "default"}>{count}</Tag>;
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_: unknown, record: User) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setViewingStaff(record);
            setStaffViewModalOpen(true);
          }}
        >
          View Users
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => {
          staffForm.resetFields();
          setStaffModalOpen(true);
        }}>
          Create Staff
        </Button>
      </div>
      <Card style={{ borderRadius: 16 }}>
        <Table
          dataSource={staffList}
          columns={columns}
          rowKey={(r) => r._id || r.id}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Create Staff Account"
        open={staffModalOpen}
        onCancel={() => setStaffModalOpen(false)}
        footer={null}
      >
        <Form form={staffForm} layout="vertical" onFinish={handleCreateStaff} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Staff name" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Valid email required" }]}>
            <Input placeholder="staff@example.com" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6, message: "Min 6 characters" }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setStaffModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Staff</Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={staffViewModalOpen}
        onCancel={() => setStaffViewModalOpen(false)}
        footer={null}
        width={typeof window !== "undefined" && window.innerWidth < 768 ? "95%" : 700}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {viewingStaff && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <Avatar size={56} src={viewingStaff.profileImage} icon={<UserOutlined />} />
              <div>
                <Title level={3} style={{ margin: 0 }}>{viewingStaff.name}</Title>
                <Paragraph style={{ color: colors.textSecondary, marginBottom: 0 }}>
                  {viewingStaff.email}
                </Paragraph>
              </div>
              <Tag color="blue" style={{ marginLeft: "auto" }}>
                <TeamOutlined style={{ marginRight: 4 }} />
                {getUsersForStaff(viewingStaff._id || viewingStaff.id || "").length} assigned
              </Tag>
            </div>

            <Card
              title={<span><TeamOutlined style={{ marginRight: 8 }} />Assigned Users</span>}
              style={{ borderRadius: 12 }}
              size="small"
            >
              {getUsersForStaff(viewingStaff._id || viewingStaff.id || "").length === 0 ? (
                <Paragraph style={{ color: colors.textSecondary }}>
                  This staff member is not currently assigned to any users.
                </Paragraph>
              ) : (
                <Table
                  dataSource={getUsersForStaff(viewingStaff._id || viewingStaff.id || "")}
                  rowKey={(r) => r._id || r.id}
                  pagination={false}
                  size="small"
                  scroll={{ x: 'max-content' }}
                  columns={[
                    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
                    { title: "Email", dataIndex: "email", key: "email" },
                    { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
                    {
                      title: "Verification",
                      dataIndex: "verificationStatus",
                      key: "verificationStatus",
                      render: (s: string) => <Tag color={s === "verified" ? "green" : s === "rejected" ? "red" : "orange"}>{s || "pending"}</Tag>,
                    },
                  ]}
                />
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}
