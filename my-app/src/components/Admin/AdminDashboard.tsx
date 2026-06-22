"use client";

import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Card,
  Avatar,
  Typography,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Popconfirm,
  message,
  Space,
  Statistic,
  Spin,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  BankOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
  ApartmentOutlined,
  EyeOutlined,
  CalendarOutlined,
  PhoneOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { colors } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/User";
import type { Hospital, HospitalFormData } from "@/types/Hospital";
import type { Appointment } from "@/types/Appointment";
import type { MedicalCondition } from "@/types/MedicalCondition";
import type { Medication } from "@/types/Medication";
import type { EmergencyContact } from "@/types/EmergencyContact";
import {
  getUsers,
  getPendingProfiles,
  verifyProfile,
  assignStaff,
  createStaff,
  getStaff,
} from "@/services/adminService";
import {
  getHospitals,
  createHospital,
  updateHospital,
  deleteHospital,
} from "@/services/hospitalService";
import { getAppointments } from "@/services/appointmentService";
import { getMedicalConditions } from "@/services/medicalConditionService";
import { getMedications } from "@/services/medicationService";
import { getEmergencyContacts } from "@/services/emergencyContactService";

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

const verificationColors: Record<string, string> = {
  pending: "orange",
  verified: "green",
  rejected: "red",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeKey, setActiveKey] = useState("1");

  const [users, setUsers] = useState<User[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<User[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyUserId, setVerifyUserId] = useState<string>("");
  const [verifyStatus, setVerifyStatus] = useState<"verified" | "rejected">("verified");
  const [verifyNotes, setVerifyNotes] = useState("");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignUserId, setAssignUserId] = useState<string>("");
  const [assignStaffId, setAssignStaffId] = useState<string>("");

  const [hospitalModalOpen, setHospitalModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [hospitalForm] = Form.useForm();

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm] = Form.useForm();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const [userConditions, setUserConditions] = useState<MedicalCondition[]>([]);
  const [userMedications, setUserMedications] = useState<Medication[]>([]);
  const [userContacts, setUserContacts] = useState<EmergencyContact[]>([]);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("user");

  const [staffViewModalOpen, setStaffViewModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<User | null>(null);

  const regularUsers = users.filter((u) => u.role === "user" || !u.role);
  const unassignedUsers = regularUsers.filter(
    (u) => u.verificationStatus === "verified" && !u.assignedStaff
  );

  const getUsersForStaff = (staffId: string) =>
    regularUsers.filter((u) => u.assignedStaff?._id === staffId);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(Array.isArray(res) ? res : []);
    } catch {
    }
  };

  const fetchPending = async () => {
    try {
      const res = await getPendingProfiles();
      setPendingProfiles(Array.isArray(res) ? res : []);
    } catch {
    }
  };

  const fetchHospitals = async () => {
    try {
      const res = await getHospitals(true);
      setHospitals(Array.isArray(res) ? res : []);
    } catch {
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await getStaff();
      setStaffList(Array.isArray(res) ? res : []);
    } catch {
    }
  };

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
        if (!cancelled) message.error("Failed to load data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeKey !== "3") return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getHospitals(true);
        if (!cancelled) setHospitals(Array.isArray(res) ? res : []);
      } catch {
      }
    };
    load();
    return () => { cancelled = true; };
  }, [activeKey]);

  const handleVerify = async () => {
    try {
      await verifyProfile(verifyUserId, { status: verifyStatus, verificationNotes: verifyNotes });
      message.success(`Profile ${verifyStatus}`);
      setVerifyModalOpen(false);
      fetchPending();
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to verify profile";
      message.error(msg);
    }
  };

  const handleAssignStaff = async () => {
    try {
      await assignStaff(assignUserId, assignStaffId);
      message.success("Staff assigned successfully");
      setAssignModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to assign staff";
      message.error(msg);
    }
  };

  const handleCreateStaff = async (values: { name: string; email: string; password: string }) => {
    try {
      await createStaff(values);
      message.success("Staff account created");
      setStaffModalOpen(false);
      staffForm.resetFields();
      fetchStaffList();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create staff";
      message.error(msg);
    }
  };

  const handleHospitalSubmit = async (values: HospitalFormData) => {
    try {
      if (editingHospital) {
        await updateHospital(editingHospital._id, values);
        message.success("Hospital updated");
      } else {
        await createHospital(values);
        message.success("Hospital added");
      }
      setHospitalModalOpen(false);
      hospitalForm.resetFields();
      fetchHospitals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save hospital";
      message.error(msg);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    try {
      await deleteHospital(id);
      message.success("Hospital deleted");
      fetchHospitals();
    } catch {
      message.error("Failed to delete hospital");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
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

  const pendingColumns = [
    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (p: string) => p || "-",
    },
    {
      title: "Actions",
      key: "actions",
      width: 320,
      render: (_: unknown, record: User) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewProfile(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => {
              setVerifyUserId(record._id || record.id);
              setVerifyStatus("verified");
              setVerifyNotes("");
              setVerifyModalOpen(true);
            }}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => {
              setVerifyUserId(record._id || record.id);
              setVerifyStatus("rejected");
              setVerifyNotes("");
              setVerifyModalOpen(true);
            }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

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
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewProfile(record)}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<UserSwitchOutlined />}
            onClick={() => {
              setAssignUserId(record._id || record.id);
              setAssignStaffId("");
              setAssignModalOpen(true);
            }}
          >
            Assign Staff
          </Button>
        </Space>
      ),
    },
  ];

  const hospitalColumns = [
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
            hospitalForm.setFieldsValue(record);
            setHospitalModalOpen(true);
          }} />
          <Popconfirm title="Delete this hospital?" onConfirm={() => handleDeleteHospital(record._id)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderContent = () => {
    switch (activeKey) {
      case "1":
        return (
          <div>
            <Title level={3} style={{ marginTop: 0 }}>Admin Dashboard</Title>
            <Row gutter={20} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                  <Statistic title="Elderly Users" value={regularUsers.length} prefix={<TeamOutlined />} styles={{ content: { color: colors.primary } }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                  <Statistic title="Staff Members" value={staffList.length} prefix={<ApartmentOutlined />} styles={{ content: { color: colors.secondary } }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                  <Statistic title="Pending Profiles" value={pendingProfiles.length} prefix={<ClockCircleOutlined />} styles={{ content: { color: "#f59e0b" } }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card style={{ borderRadius: 16, textAlign: "center" }}>
                  <Statistic title="Verified Users" value={regularUsers.filter((u) => u.verificationStatus === "verified").length} prefix={<CheckCircleOutlined />} styles={{ content: { color: "#10b981" } }} />
                </Card>
              </Col>
            </Row>

            <Row gutter={20}>
              <Col span={12}>
                <Card title="Recent Users" style={{ borderRadius: 16 }}>
                  <Table dataSource={regularUsers.slice(0, 5)} columns={usersColumns.slice(0, 3)} rowKey={(r) => r._id || r.id} pagination={false} size="small" />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Pending Verification" style={{ borderRadius: 16 }}>
                  {pendingProfiles.length === 0 ? (
                    <Paragraph style={{ color: colors.textSecondary }}>No pending profiles.</Paragraph>
                  ) : (
                    <Table dataSource={pendingProfiles.slice(0, 5)} columns={pendingColumns.slice(0, 3)} rowKey={(r) => r._id || r.id} pagination={false} size="small" />
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        );
      case "2":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>Users</Title>
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
                dataSource={
                  userRoleFilter === "all"
                    ? users
                    : userRoleFilter === "user"
                    ? users.filter((u) => u.role === "user" || !u.role)
                    : users.filter((u) => u.role === userRoleFilter)
                }
                columns={usersColumns}
                rowKey={(r) => r._id || r.id}
                loading={loading}
                pagination={{ pageSize: 10, showSizeChanger: true }}
              />
            </Card>
          </div>
        );
      case "3":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>Hospitals</Title>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                setEditingHospital(null);
                hospitalForm.resetFields();
                setHospitalModalOpen(true);
              }}>
                Add Hospital
              </Button>
            </div>
            <Card style={{ borderRadius: 16 }}>
              <Table dataSource={hospitals} columns={hospitalColumns} rowKey="_id" loading={loading} pagination={{ pageSize: 10 }} />
            </Card>
          </div>
        );
      case "4":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Title level={3} style={{ margin: 0 }}>Staff Management</Title>
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
                columns={[
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
                ]}
                rowKey={(r) => r._id || r.id}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </div>
        );
      case "5":
        return (
          <div>
            <Title level={3} style={{ marginTop: 0 }}>Pending Profiles</Title>
            <Card style={{ borderRadius: 16 }}>
              {pendingProfiles.length === 0 ? (
                <Paragraph style={{ color: colors.textSecondary, textAlign: "center", padding: 40 }}>
                  No pending profiles to verify.
                </Paragraph>
              ) : (
                <Table dataSource={pendingProfiles} columns={pendingColumns} rowKey={(r) => r._id || r.id} loading={loading} pagination={{ pageSize: 10 }} />
              )}
            </Card>
          </div>
        );
      case "6":
        return (
          <div>
            <Title level={3} style={{ marginTop: 0 }}>Unassigned Users</Title>
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
                  pagination={{ pageSize: 10 }}
                />
              )}
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: colors.background }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Layout
        style={{
          minHeight: "90vh",
          width: "95vw",
          maxWidth: "1500px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
      >
        <Sider
          width={250}
          theme="light"
          style={{
            background: colors.cardBackground,
            borderRight: "1px solid #e5e7eb",
          }}
        >
          <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ padding: "30px 20px" }}>
                <Title level={4} style={{ color: colors.primary, margin: 0 }}>Elder Care Admin</Title>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[activeKey]}
                onClick={({ key }) => setActiveKey(key)}
                items={[
                  { key: "1", icon: <HomeOutlined />, label: "Dashboard" },
                  { key: "2", icon: <TeamOutlined />, label: "Users" },
                  { key: "5", icon: <ClockCircleOutlined />, label: `Pending Profiles (${pendingProfiles.length})` },
                  { key: "6", icon: <UserSwitchOutlined />, label: `Unassigned Users (${unassignedUsers.length})` },
                  { key: "3", icon: <BankOutlined />, label: "Hospitals" },
                  { key: "4", icon: <UserAddOutlined />, label: "Staff" },
                ]}
              />
            </div>
            <div style={{ padding: 20 }}>
              <Button danger block icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
            </div>
          </div>
        </Sider>

        <Content style={{ padding: "30px", background: "transparent" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Title level={3} style={{ margin: 0 }}>
              {activeKey === "1" && "Dashboard"}
              {activeKey === "2" && "Users"}
              {activeKey === "3" && "Hospitals"}
              {activeKey === "4" && "Staff Management"}
              {activeKey === "5" && "Pending Profiles"}
              {activeKey === "6" && "Unassigned Users"}
            </Title>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Tag color="red">Admin</Tag>
              <Avatar size={50} src={user.profileImage} icon={<UserOutlined />} />
            </div>
          </div>

          {renderContent()}
        </Content>
      </Layout>

      {/* Verify Profile Modal */}
      <Modal
        title={`${verifyStatus === "verified" ? "Approve" : "Reject"} Profile`}
        open={verifyModalOpen}
        onCancel={() => setVerifyModalOpen(false)}
        onOk={handleVerify}
        okText={verifyStatus === "verified" ? "Approve" : "Reject"}
        okButtonProps={{ danger: verifyStatus === "rejected" }}
      >
        <Form layout="vertical">
          <Form.Item label="Verification Status">
            <Select value={verifyStatus} onChange={(v) => setVerifyStatus(v)}>
              <Select.Option value="verified">Verified</Select.Option>
              <Select.Option value="rejected">Rejected</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Notes">
            <Input.TextArea rows={3} value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} placeholder="Optional verification notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Staff Modal */}
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
                const count = getUsersForStaff(sid).length;
                return (
                  <Select.Option key={sid} value={sid}>
                    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>{s.name} ({s.email})</span>
                      <Tag color={count > 0 ? "blue" : "default"} style={{ marginLeft: 8 }}>
                        {count} user{count === 1 ? "" : "s"}
                      </Tag>
                    </span>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Staff Modal */}
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

      {/* Hospital Form Modal */}
      <Modal
        title={editingHospital ? "Edit Hospital" : "Add Hospital"}
        open={hospitalModalOpen}
        onCancel={() => setHospitalModalOpen(false)}
        footer={null}
      >
        <Form
          form={hospitalForm}
          layout="vertical"
          onFinish={handleHospitalSubmit}
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
            <Input placeholder="Phone" />
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
            <Button onClick={() => setHospitalModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              {editingHospital ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* User Profile View Modal */}
      <Modal
        title={null}
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
        width={900}
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

              {viewingUser.role !== "admin" && viewingUser.role !== "staff" && (
                <Card size="small" style={{ marginBottom: 20, borderRadius: 12, background: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      {viewingUser.verificationStatus !== "verified" ? (
                        <span>
                          <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => {
                              setVerifyUserId(viewingUser._id || viewingUser.id);
                              setVerifyStatus("verified");
                              setVerifyNotes("");
                              setVerifyModalOpen(true);
                            }}
                            style={{ marginRight: 8 }}
                          >
                            Approve
                          </Button>
                          <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => {
                              setVerifyUserId(viewingUser._id || viewingUser.id);
                              setVerifyStatus("rejected");
                              setVerifyNotes("");
                              setVerifyModalOpen(true);
                            }}
                          >
                            Reject
                          </Button>
                        </span>
                      ) : (
                        <Tag color="green">Verified</Tag>
                      )}
                    </div>
                    <Button
                      icon={<UserSwitchOutlined />}
                      onClick={() => {
                        setAssignUserId(viewingUser._id || viewingUser.id);
                        setAssignStaffId(viewingUser.assignedStaff?._id || "");
                        setAssignModalOpen(true);
                      }}
                    >
                      {viewingUser.assignedStaff ? "Change Staff" : "Assign Staff"}
                    </Button>
                  </div>
                </Card>
              )}

              <Card title="Basic Information" style={{ borderRadius: 12, marginBottom: 16 }} size="small">
                <Row gutter={[16, 8]}>
                  <Col span={8}><strong>Date of Birth:</strong> {viewingUser.dateOfBirth ? dayjs(viewingUser.dateOfBirth).format("MMM D, YYYY") : "-"}</Col>
                  <Col span={8}><strong>Gender:</strong> {viewingUser.gender ? viewingUser.gender.charAt(0).toUpperCase() + viewingUser.gender.slice(1) : "-"}</Col>
                  <Col span={8}><strong>Blood Group:</strong> {viewingUser.bloodGroup || "-"}</Col>
                  <Col span={8}><strong>Phone:</strong> {viewingUser.phone || "-"}</Col>
                  <Col span={8}><strong>Address:</strong> {viewingUser.address || "-"}</Col>
                  <Col span={8}><strong>Profile:</strong> {viewingUser.profileCompleted ? <Tag color="green">Completed</Tag> : <Tag color="orange">Incomplete</Tag>}</Col>
                  <Col span={24}><strong>Identification Mark:</strong> {viewingUser.identificationMark || "-"}</Col>
                  <Col span={24}><strong>Emergency Notes:</strong> {viewingUser.emergencyNotes || "-"}</Col>
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
                    columns={[
                      { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
                      { title: "Hospital", dataIndex: "hospital", key: "hospital", render: (v: string) => v || "-" },
                      { title: "Date", dataIndex: "appointmentDate", key: "appointmentDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                      { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
                      {
                        title: "Status", dataIndex: "status", key: "status",
                        render: (s: string) => <Tag color={s === "pending" ? "blue" : s === "pending_confirmation" ? "orange" : s === "user_confirmed" ? "purple" : s === "approved" ? "green" : s === "scheduled" ? "cyan" : s === "completed" ? "default" : "red"}>{s.replace(/_/g, " ")}</Tag>,
                      },
                    ]}
                  />
                )}
              </Card>

              <Row gutter={16}>
                <Col span={12}>
                  <Card
                    title={<span><HeartOutlined style={{ marginRight: 8 }} />Medical Conditions ({userConditions.length})</span>}
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    size="small"
                  >
                    {userConditions.length === 0 ? (
                      <Paragraph style={{ color: colors.textSecondary }}>No conditions recorded.</Paragraph>
                    ) : (
                      <Table
                        dataSource={userConditions}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: "Condition", dataIndex: "condition", key: "condition" },
                          { title: "Diagnosed", dataIndex: "diagnosedDate", key: "diagnosedDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                        ]}
                      />
                    )}
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    title={<span><MedicineBoxOutlined style={{ marginRight: 8 }} />Medications ({userMedications.length})</span>}
                    style={{ borderRadius: 12, marginBottom: 16 }}
                    size="small"
                  >
                    {userMedications.length === 0 ? (
                      <Paragraph style={{ color: colors.textSecondary }}>No medications recorded.</Paragraph>
                    ) : (
                      <Table
                        dataSource={userMedications}
                        rowKey="_id"
                        pagination={false}
                        size="small"
                        columns={[
                          { title: "Medicine", dataIndex: "medicineName", key: "medicineName" },
                          { title: "Dosage", dataIndex: "dosage", key: "dosage" },
                        ]}
                      />
                    )}
                  </Card>
                </Col>
              </Row>

              <Card
                title={<span><PhoneOutlined style={{ marginRight: 8 }} />Emergency Contacts ({userContacts.length})</span>}
                style={{ borderRadius: 12 }}
                size="small"
              >
                {userContacts.length === 0 ? (
                  <Paragraph style={{ color: colors.textSecondary }}>No emergency contacts.</Paragraph>
                ) : (
                  <Table
                    dataSource={userContacts}
                    rowKey="_id"
                    pagination={false}
                    size="small"
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

      {/* Staff Assigned Users View Modal */}
      <Modal
        title={null}
        open={staffViewModalOpen}
        onCancel={() => setStaffViewModalOpen(false)}
        footer={null}
        width={700}
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
                  columns={[
                    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
                    { title: "Email", dataIndex: "email", key: "email" },
                    { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
                    {
                      title: "Verification",
                      dataIndex: "verificationStatus",
                      key: "verificationStatus",
                      render: (s: string) => <Tag color={verificationColors[s] || "default"}>{s || "pending"}</Tag>,
                    },
                    {
                      title: "",
                      key: "view",
                      width: 80,
                      render: (_: unknown, record: User) => (
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => {
                            setStaffViewModalOpen(false);
                            viewProfile(record);
                          }}
                        />
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          </div>
        )}
      </Modal>
    </motion.div>
  );
}
