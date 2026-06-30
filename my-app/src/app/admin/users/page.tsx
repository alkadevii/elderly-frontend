"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Space,
  message,
  Spin,
  Avatar,
  Typography,
  Row,
  Col,
  Modal,
  Form,
  Input,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("user");

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

  const usersColumns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (r: string) => <Tag color={r === "admin" ? "red" : r === "staff" ? "blue" : "green"}>{r}</Tag>,
    },
    {
      title: "Verification",
      dataIndex: "verificationStatus",
      key: "verificationStatus",
      render: (s: string) => (
        <Tag color={verificationColors[s] || "default"}>{s || "pending"}</Tag>
      ),
    },
    {
      title: "Profile",
      dataIndex: "profileCompleted",
      key: "profileCompleted",
      render: (c: boolean) => c ? <CheckCircleOutlined style={{ color: "green" }} /> : <CloseCircleOutlined style={{ color: "#ccc" }} />,
    },
    {
      title: "Assigned Staff",
      key: "assignedStaff",
      render: (_: unknown, record: User) => record.assignedStaff?.name || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      render: (_: unknown, record: User) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewProfile(record)}
          >
            View
          </Button>
          {record.role !== "admin" && (
            <Button
              type="link"
              size="small"
              icon={<UserSwitchOutlined />}
              onClick={() => {
                setAssignUserId(record._id || record.id);
                setAssignStaffId(record.assignedStaff?._id || "");
                setAssignModalOpen(true);
              }}
            >
              Assign Staff
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const filteredUsers =
    userRoleFilter === "all"
      ? users
      : userRoleFilter === "user"
      ? users.filter((u) => u.role === "user" || !u.role)
      : users.filter((u) => u.role === userRoleFilter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 }}>
        <Select
          value={userRoleFilter}
          onChange={setUserRoleFilter}
          style={{ width: 140 }}
        >
          <Select.Option value="all">All Roles</Select.Option>
          <Select.Option value="user">Elderly Users</Select.Option>
          <Select.Option value="staff">Staff</Select.Option>
          <Select.Option value="admin">Admins</Select.Option>
        </Select>
      </div>
      <Card style={{ borderRadius: 16 }}>
          <Table
            dataSource={filteredUsers}
            columns={usersColumns}
            rowKey={(r) => r._id || r.id}
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
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
                    <Paragraph style={{ color: colors.textSecondary, marginBottom: 0 }}>
                      {viewingUser.email}
                    </Paragraph>
                  </div>
                </div>
                <Space>
                  <Tag color={viewingUser.role === "admin" ? "red" : viewingUser.role === "staff" ? "blue" : "green"}>
                    {viewingUser.role}
                  </Tag>
                  <Tag color={verificationColors[viewingUser.verificationStatus || ""] || "default"}>
                    {viewingUser.verificationStatus || "pending"}
                  </Tag>
                  {viewingUser.assignedStaff && (
                    <Tag color="blue">
                      <TeamOutlined style={{ marginRight: 4 }} />
                      {viewingUser.assignedStaff.name}
                    </Tag>
                  )}
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

              <Card
                title={<span><CalendarOutlined style={{ marginRight: 8 }} />Appointments ({userAppointments.length})</span>}
                style={{ borderRadius: 12, marginBottom: 16 }}
                size="small"
              >
                {userAppointments.length === 0 ? (
                  <Paragraph style={{ color: colors.textSecondary }}>No appointments.</Paragraph>
                ) : (
                  <Table
                    dataSource={userAppointments}
                    rowKey="_id"
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    columns={[
                      { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
                      { title: "Hospital", dataIndex: "hospital", key: "hospital", render: (v: string) => v || "-" },
                      { title: "Date", dataIndex: "appointmentDate", key: "appointmentDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                      { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
                      {
                        title: "Status", dataIndex: "status", key: "status",
                        render: (s: string) => {
                          const sc: Record<string, string> = {
                            pending: "blue", pending_confirmation: "orange", user_confirmed: "purple",
                            approved: "green", scheduled: "cyan", awaiting_feedback: "orange",
                            feedback_provided: "geekblue", completed: "default", cancelled: "red",
                            rejected: "red", cancellation_requested: "volcano",
                          };
                          return <Tag color={sc[s] || "default"}>{s.replace(/_/g, " ")}</Tag>;
                        },
                      },
                    ]}
                  />
                )}
              </Card>

              <Row gutter={[12, 12]}>
                <Col xs={24} lg={12}>
                  <Card title={<span><HeartOutlined style={{ marginRight: 8 }} />Medical Conditions ({userConditions.length})</span>} style={{ borderRadius: 12, marginBottom: 16 }} size="small">
                    {userConditions.length === 0 ? (
                      <Paragraph style={{ color: colors.textSecondary }}>No conditions recorded.</Paragraph>
                    ) : (
                      <Table dataSource={userConditions} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                        columns={[
                          { title: "Condition", dataIndex: "condition", key: "condition" },
                          { title: "Diagnosed", dataIndex: "diagnosedDate", key: "diagnosedDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                        ]}
                      />
                    )}
                  </Card>
                </Col>
                <Col xs={24} lg={12}>
                  <Card title={<span><MedicineBoxOutlined style={{ marginRight: 8 }} />Medications ({userMedications.length})</span>} style={{ borderRadius: 12, marginBottom: 16 }} size="small">
                    {userMedications.length === 0 ? (
                      <Paragraph style={{ color: colors.textSecondary }}>No medications recorded.</Paragraph>
                    ) : (
                      <Table dataSource={userMedications} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                        columns={[
                          { title: "Medicine", dataIndex: "medicineName", key: "medicineName" },
                          { title: "Dosage", dataIndex: "dosage", key: "dosage" },
                        ]}
                      />
                    )}
                  </Card>
                </Col>
              </Row>

              <Card title={<span><PhoneOutlined style={{ marginRight: 8 }} />Emergency Contacts ({userContacts.length})</span>} style={{ borderRadius: 12 }} size="small">
                {userContacts.length === 0 ? (
                  <Paragraph style={{ color: colors.textSecondary }}>No emergency contacts.</Paragraph>
                ) : (
                  <Table dataSource={userContacts} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                    columns={[
                      { title: "Name", dataIndex: "name", key: "name" },
                      { title: "Relationship", dataIndex: "relationship", key: "relationship" },
                      { title: "Phone", dataIndex: "phone", key: "phone" },
                      { title: "Email", dataIndex: "email", key: "email", render: (v: string) => v || "-" },
                    ]}
                  />
                )}
              </Card>
            </div>
          </Spin>
        )}
      </Modal>
    </div>
  );
}
