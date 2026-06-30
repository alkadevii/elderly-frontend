"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Spin,
  Tag,
} from "antd";
import {
  TeamOutlined,
  ApartmentOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { colors } from "@/styles/theme";
import type { User } from "@/types/User";
import { getUsers, getPendingProfiles, getStaff } from "@/services/adminService";

const { Paragraph } = Typography;

const verificationColors: Record<string, string> = {
  pending: "orange",
  verified: "green",
  rejected: "red",
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const regularUsers = users.filter((u) => u.role === "user" || !u.role);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, pendingRes, staffRes] = await Promise.all([
          getUsers(),
          getPendingProfiles(),
          getStaff(),
        ]);
        if (!cancelled) {
          setUsers(Array.isArray(usersRes) ? usersRes : []);
          setPendingProfiles(Array.isArray(pendingRes) ? pendingRes : []);
          setStaffList(Array.isArray(staffRes) ? staffRes : []);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const usersColumns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (r: string) => <Tag color={r === "admin" ? "red" : r === "staff" ? "blue" : "green"}>{r}</Tag>,
    },
  ];

  const pendingColumns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (p: string) => p || "-" },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic title="Elderly Users" value={regularUsers.length} prefix={<TeamOutlined />} styles={{ content: { color: colors.primary } }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic title="Staff Members" value={staffList.length} prefix={<ApartmentOutlined />} styles={{ content: { color: colors.secondary } }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic title="Pending Profiles" value={pendingProfiles.length} prefix={<ClockCircleOutlined />} styles={{ content: { color: pendingProfiles.length > 0 ? "#ef4444" : colors.textSecondary } }} />
          </Card>
        </Col>
        <Col xs={12} sm={12} lg={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic title="Verified Users" value={regularUsers.filter((u) => u.verificationStatus === "verified").length} prefix={<CheckCircleOutlined />} styles={{ content: { color: "#10b981" } }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]}>
        <Col xs={24} lg={12}>
          <Card title="Recent Users" style={{ borderRadius: 16 }}>
            <Table dataSource={regularUsers.slice(0, 5)} columns={usersColumns} rowKey={(r) => r._id || r.id} pagination={false} size="small" scroll={{ x: 'max-content' }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Pending Verification" style={{ borderRadius: 16 }}>
            {pendingProfiles.length === 0 ? (
              <Paragraph style={{ color: colors.textSecondary }}>No pending profiles.</Paragraph>
            ) : (
              <Table dataSource={pendingProfiles.slice(0, 5)} columns={pendingColumns} rowKey={(r) => r._id || r.id} pagination={false} size="small" scroll={{ x: 'max-content' }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
