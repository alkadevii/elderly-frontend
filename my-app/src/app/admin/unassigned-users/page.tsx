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
  Select,
  Avatar,
  Typography,
  Row,
  Col,
  Spin,
  message,
} from "antd";
import {
  EyeOutlined,
  UserSwitchOutlined,
  UserOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { colors } from "@/styles/theme";
import dayjs from "dayjs";
import type { User } from "@/types/User";
import type { Appointment } from "@/types/Appointment";
import type { MedicalCondition } from "@/types/MedicalCondition";
import type { Medication } from "@/types/Medication";
import type { EmergencyContact } from "@/types/EmergencyContact";
import { getUsers, getStaff, assignStaff } from "@/services/adminService";
import { getAppointments } from "@/services/appointmentService";
import { getMedicalConditions } from "@/services/medicalConditionService";
import { getMedications } from "@/services/medicationService";
import { getEmergencyContacts } from "@/services/emergencyContactService";

const { Title, Paragraph } = Typography;
const verificationColors: Record<string, string> = {
  pending: "orange",
  verified: "green",
  rejected: "red",
};

export default function AdminUnassignedUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string>("");
  const [assignStaffId, setAssignStaffId] = useState<string>("");

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [userConditions, setUserConditions] = useState<MedicalCondition[]>([]);
  const [userMedications, setUserMedications] = useState<Medication[]>([]);
  const [userContacts, setUserContacts] = useState<EmergencyContact[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);

  const regularUsers = users.filter((u) => u.role === "user" || !u.role);
  const unassignedUsers = regularUsers.filter(
    (u) => u.verificationStatus === "verified" && !u.assignedStaff
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [usersRes, staffRes] = await Promise.all([getUsers(), getStaff()]);
        if (!cancelled) {
          setUsers(Array.isArray(usersRes) ? usersRes : []);
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

  const handleAssignStaff = async () => {
    try {
      await assignStaff(assignUserId, assignStaffId);
      message.success("Staff assigned successfully");
      setAssignModalOpen(false);
      const res = await getUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign staff";
      message.error(msg);
    }
  };

  const viewProfile = async (u: User) => {
    const userId = u._id || u.id;
    setViewingUser(u);
    setProfileModalOpen(true);
    setProfileLoading(true);
    try {
      const [appRes, condRes, medRes, conRes] = await Promise.all([
        getAppointments(userId),
        getMedicalConditions(userId),
        getMedications(userId),
        getEmergencyContacts(userId),
      ]);
      setUserAppointments(
        (Array.isArray(appRes) ? appRes : []).filter(
          (a: Appointment) => a.user?._id === userId
        )
      );
      setUserConditions(Array.isArray(condRes) ? condRes : []);
      setUserMedications(Array.isArray(medRes) ? medRes : []);
      setUserContacts(Array.isArray(conRes) ? conRes : []);
    } catch {
      message.error("Failed to load user data");
    } finally {
      setProfileLoading(false);
    }
  };

  const unassignedColumns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
    { title: "Phone", dataIndex: "phone", key: "phone", render: (p: string) => p || "-" },
    {
      title: "Verification",
      dataIndex: "verificationStatus",
      key: "verificationStatus",
      render: (s: string) => <Tag color={verificationColors[s] || "default"}>{s || "pending"}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      width: 280,
      render: (_: unknown, record: User) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => viewProfile(record)}>View</Button>
          <Button type="primary" size="small" icon={<UserSwitchOutlined />}
            onClick={() => {
              setAssignUserId(record._id || record.id);
              setAssignStaffId("");
              setAssignModalOpen(true);
            }}
          >Assign Staff</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Paragraph style={{ color: colors.textSecondary, marginBottom: 16 }}>
        Verified users who have not yet been assigned a staff member.
      </Paragraph>
      <Card style={{ borderRadius: 16 }}>
        {unassignedUsers.length === 0 ? (
          <Paragraph style={{ color: colors.textSecondary, textAlign: "center", padding: 40 }}>
            All verified users have a staff member assigned.
          </Paragraph>
        ) : (
          <Table
            dataSource={unassignedUsers}
            columns={unassignedColumns}
            rowKey={(r) => r._id || r.id}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="Assign Staff"
        open={assignModalOpen}
        onCancel={() => setAssignModalOpen(false)}
        onOk={handleAssignStaff}
        okText="Assign"
      >
        <Form layout="vertical">
          <Form.Item label="Select Staff">
            <Select
              value={assignStaffId || undefined}
              onChange={(v) => setAssignStaffId(v)}
              placeholder="Choose a staff member"
              allowClear
            >
              {staffList.map((s) => {
                const sid = s._id || s.id || "";
                return (
                  <Select.Option key={sid} value={sid}>
                    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{s.name} ({s.email})</span>
                    </span>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={null}
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        width={typeof window !== "undefined" && window.innerWidth < 768 ? "95%" : 900}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {viewingUser && (
          <Spin spinning={profileLoading}>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <Avatar size={64} src={viewingUser.profileImage} icon={<UserOutlined />} />
                  <div>
                    <Title level={3} style={{ margin: 0 }}>{viewingUser.name}</Title>
                    <Paragraph style={{ color: colors.textSecondary, marginBottom: 0 }}>{viewingUser.email}</Paragraph>
                  </div>
                </div>
                <Space>
                  <Tag color={verificationColors[viewingUser.verificationStatus || ""] || "default"}>
                    {viewingUser.verificationStatus || "pending"}
                  </Tag>
                </Space>
              </div>

              <Card title="Basic Information" style={{ borderRadius: 12, marginBottom: 16 }} size="small">
                <Row gutter={[16, 8]}>
                  <Col xs={24} md={12} lg={8}><strong>Date of Birth:</strong> {viewingUser.dateOfBirth ? dayjs(viewingUser.dateOfBirth).format("MMM D, YYYY") : "-"}</Col>
                  <Col xs={24} md={12} lg={8}><strong>Age:</strong> {viewingUser.age ?? (viewingUser.dateOfBirth ? dayjs().diff(dayjs(viewingUser.dateOfBirth), "year") : "-")}</Col>
                  <Col xs={24} md={12} lg={8}><strong>Gender:</strong> {viewingUser.gender ? viewingUser.gender.charAt(0).toUpperCase() + viewingUser.gender.slice(1) : "-"}</Col>
                  <Col xs={24} md={12} lg={8}><strong>Blood Group:</strong> {viewingUser.bloodGroup || "-"}</Col>
                  <Col xs={24} md={12} lg={8}><strong>Phone:</strong> {viewingUser.phone || "-"}</Col>
                  <Col xs={24} md={12} lg={8}><strong>Address:</strong> {viewingUser.address || "-"}</Col>
                  <Col xs={24} md={12} lg={8}><strong>Profile:</strong> {viewingUser.profileCompleted ? <Tag color="green">Completed</Tag> : <Tag color="orange">Incomplete</Tag>}</Col>
                  <Col xs={24}><strong>Identification Mark:</strong> {viewingUser.identificationMark || "-"}</Col>
                  <Col xs={24}><strong>Emergency Notes:</strong> {viewingUser.emergencyNotes || "-"}</Col>
                </Row>
              </Card>
            </div>
          </Spin>
        )}
      </Modal>
    </div>
  );
}
