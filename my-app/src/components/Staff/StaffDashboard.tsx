"use client";

import { useState, useEffect, useRef } from "react";
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
  Tag,
  message,
  Statistic,
  Spin,
  Descriptions,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Progress,
  Rate,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  TeamOutlined,
  CalendarOutlined,
  PhoneOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  HistoryOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { colors } from "@/styles/theme";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/User";
import type { Appointment, AppointmentStatus } from "@/types/Appointment";
import type { EmergencyContact } from "@/types/EmergencyContact";
import type { MedicalCondition } from "@/types/MedicalCondition";
import type { Medication } from "@/types/Medication";
import type { Hospital } from "@/types/Hospital";
import type { StaffDashboardData } from "@/types/StaffDashboard";
import { getAssignedUsers, getStaffDashboard } from "@/services/adminService";
import {
  getAppointments,
  updateAppointment,
  reviewAppointment,
  createAppointment,
  finalizeAppointment,
  approveCancellation,
  rejectCancellation,
  closeAppointment,
} from "@/services/appointmentService";
import { getHospitals } from "@/services/hospitalService";
import {
  getEmergencyContacts,
} from "@/services/emergencyContactService";
import {
  getMedicalConditions,
} from "@/services/medicalConditionService";
import {
  getMedications,
} from "@/services/medicationService";
import VitalsSection from "@/components/Dashboard/VitalsSection";
import type { StaffRating } from "@/types/Review";
import { getReviews, getStaffRating } from "@/services/reviewService";

import dayjs from "dayjs";

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

const statusColors: Record<string, string> = {
  pending: "blue",
  pending_confirmation: "orange",
  user_confirmed: "purple",
  approved: "green",
  scheduled: "cyan",
  awaiting_feedback: "orange",
  feedback_provided: "geekblue",
  completed: "default",
  cancelled: "red",
  rejected: "red",
  cancellation_requested: "volcano",
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function StaffDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeKey, setActiveKey] = useState("1");

  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);

  const [loading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [myRating, setMyRating] = useState<StaffRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"scheduled" | "rejected">("scheduled");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewTokenNumber, setReviewTokenNumber] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [proposeModalOpen, setProposeModalOpen] = useState(false);
  const [proposingForUserId, setProposingForUserId] = useState<string | null>(null);
  const [proposeSubmitting, setProposeSubmitting] = useState(false);
  const [proposeForm] = Form.useForm();
  const [replacingAppointment, setReplacingAppointment] = useState<Appointment | null>(null);

  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [finalizingAppointment, setFinalizingAppointment] = useState<Appointment | null>(null);
  const [finalizeSubmitting, setFinalizeSubmitting] = useState(false);
  const [finalizeForm] = Form.useForm();

  const assignedUsersRef = useRef<User[]>([]);

  const fetchAllAppointments = async (users: User[]): Promise<Appointment[]> => {
    if (users.length === 0) return [];
    const results = await Promise.all(
      users.map((u) =>
        getAppointments(u._id || u.id).catch(() => [] as Appointment[])
      )
    );
    return results.flatMap((res) => {
      const list = Array.isArray(res) ? res : (res.data || res.appointments || []);
      return Array.isArray(list) ? list : [];
    });
  };

  const fetchPendingAppointments = async (users: User[]) => {
    if (users.length === 0) {
      setPendingAppointments([]);
      return;
    }
    setPendingLoading(true);
    try {
      const all = await fetchAllAppointments(users);
      setPendingAppointments(
        all.filter((a: Appointment) =>
          ["pending", "user_confirmed", "cancellation_requested", "feedback_provided"].includes(a.status)
        )
      );
    } catch {
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [dashboardRes, assignedRes] = await Promise.all([
          getStaffDashboard(),
          getAssignedUsers(),
        ]);
        if (!cancelled) {
          const data = dashboardRes.data || dashboardRes;
          setDashboardData(data);
          const list = Array.isArray(assignedRes) ? assignedRes : [];
          setAssignedUsers(list);
          assignedUsersRef.current = list;
          setPendingAppointments(
            list.length > 0
              ? (data.pendingActions?.pendingReview > 0 ||
                data.pendingActions?.awaitingFeedback > 0 ||
                data.pendingActions?.feedbackToClose > 0 ||
                data.pendingActions?.cancellationRequests > 0)
                ? (await fetchAllAppointments(list)).filter((a: Appointment) =>
                    ["pending", "user_confirmed", "cancellation_requested", "feedback_provided"].includes(a.status)
                  )
                : []
              : []
          );
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    let cancelled = false;
    const load = async () => {
      setRatingLoading(true);
      try {
        const res = await getStaffRating(user._id);
        if (!cancelled) setMyRating(res.data || res);
      } catch {
      } finally {
        if (!cancelled) setRatingLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?._id]);

  const handleMenuClick = (key: string) => {
    setActiveKey(key);
    setSelectedUser(null);
    if (key === "3") fetchPendingAppointments(assignedUsers);
  };

  const selectUser = async (u: User) => {
    setSelectedUser(u);
    setResourceLoading(true);
    try {
      const userId = u._id || u.id;
      const [appRes, conRes, condRes, medRes] = await Promise.all([
        getAppointments(userId),
        getEmergencyContacts(userId),
        getMedicalConditions(userId),
        getMedications(userId),
      ]);
      setAppointments(Array.isArray(appRes) ? appRes : []);
      setContacts(Array.isArray(conRes) ? conRes : []);
      setConditions(Array.isArray(condRes) ? condRes : []);
      setMedications(Array.isArray(medRes) ? medRes : []);
    } catch {
      message.error("Failed to load user data");
    } finally {
      setResourceLoading(false);
    }
  };

  const openReview = (appointment: Appointment, status: "scheduled" | "rejected") => {
    setReviewingAppointment(appointment);
    setReviewStatus(status);
    setReviewNotes("");
    setReviewTokenNumber("");
    setReviewModalOpen(true);
  };

  const submitReview = async () => {
    if (!reviewingAppointment) return;
    if (reviewStatus === "rejected" && !reviewNotes.trim()) {
      message.warning("Please provide a reason for rejection");
      return;
    }
    if (reviewStatus === "scheduled" && !reviewTokenNumber.trim()) {
      message.warning("Token number is required to schedule the appointment");
      return;
    }
    setReviewSubmitting(true);
    try {
      const res = await reviewAppointment(reviewingAppointment._id, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
        tokenNumber: reviewStatus === "scheduled" ? reviewTokenNumber.trim() : undefined,
      });
      message.success(`Appointment ${res.appointment?.status || reviewStatus}`);
      setReviewModalOpen(false);
      const rejectedAppt = reviewingAppointment;
      if (selectedUser) selectUser(selectedUser);
      fetchPendingAppointments(assignedUsers);
      if (reviewStatus === "rejected") {
        Modal.confirm({
          title: "Propose a new appointment?",
          content: "Open a form to suggest a new date/place for this patient to confirm.",
          okText: "Propose",
          cancelText: "Not now",
          onOk: () => openPropose(rejectedAppt),
        });
      }
    } catch (err) {
      message.error((err as Error)?.message || "Failed to review appointment");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openPropose = (appointment?: Appointment) => {
    const userId =
      appointment?.user?._id ||
      (selectedUser ? selectedUser._id || selectedUser.id : undefined);
    if (!userId) {
      message.error("No patient selected to propose an appointment for");
      return;
    }
    setProposingForUserId(userId);
    setReplacingAppointment(
      appointment && appointment.status !== "rejected" ? appointment : null
    );
    if (hospitals.length === 0) {
      getHospitals(true)
        .then((res) => {
          const list = Array.isArray(res) ? res : (res.data || res.hospitals || []);
          setHospitals((list as Hospital[]).filter((h) => h.isActive));
        })
        .catch(() => {});
    }
    proposeForm.resetFields();
    if (appointment) {
      proposeForm.setFieldsValue({
        doctorName: appointment.doctorName,
        hospital: appointment.hospital,
        reason: appointment.reason,
      });
    }
    setProposeModalOpen(true);
  };

  const submitPropose = async (values: Record<string, unknown>) => {
    if (!proposingForUserId) return;
    setProposeSubmitting(true);
    try {
      const replacing = replacingAppointment;
      if (replacing) {
        await reviewAppointment(replacing._id, {
          status: "rejected",
          reviewNotes: `Replaced by a new proposal — ${(values.reviewNotes as string) || "no longer needed"}`,
        }).catch(() => {});
      }
      const payload = {
        userId: proposingForUserId,
        doctorName: values.doctorName as string,
        hospital: values.hospital as string,
        appointmentDate: values.appointmentDate
          ? dayjs(values.appointmentDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : "",
        reason: values.reason as string,
        reviewNotes: (values.reviewNotes as string) || undefined,
      };
      await createAppointment(payload);
      message.success(
        replacing
          ? "Previous appointment rejected & new proposal sent to user"
          : "Appointment proposed to user - awaiting confirmation"
      );
      setReplacingAppointment(null);
      setProposeModalOpen(false);
      if (selectedUser) selectUser(selectedUser);
      fetchPendingAppointments(assignedUsers);
    } catch (err) {
      message.error((err as Error)?.message || "Failed to propose appointment");
    } finally {
      setProposeSubmitting(false);
    }
  };

  const openFinalize = (appointment: Appointment) => {
    setFinalizingAppointment(appointment);
    finalizeForm.resetFields();
    finalizeForm.setFieldsValue({
      appointmentDate: appointment.appointmentDate ? dayjs(appointment.appointmentDate) : undefined,
    });
    setFinalizeModalOpen(true);
  };

  const submitFinalize = async (values: Record<string, unknown>) => {
    if (!finalizingAppointment) return;
    const tokenNumber = (values.tokenNumber as string)?.trim();
    if (!tokenNumber) {
      message.warning("Token number is required to finalize the appointment");
      return;
    }
    setFinalizeSubmitting(true);
    try {
      const payload: {
        tokenNumber: string;
        appointmentDate?: string;
        finalNotes?: string;
      } = { tokenNumber };
      if (values.appointmentDate) {
        payload.appointmentDate = dayjs(values.appointmentDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD");
      }
      if (values.finalNotes) {
        payload.finalNotes = (values.finalNotes as string).trim();
      }
      await finalizeAppointment(finalizingAppointment._id, payload);
      message.success("Appointment finalized and scheduled");
      setFinalizeModalOpen(false);
      if (selectedUser) selectUser(selectedUser);
      fetchPendingAppointments(assignedUsers);
    } catch (err) {
      message.error((err as Error)?.message || "Failed to finalize appointment");
    } finally {
      setFinalizeSubmitting(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointment(appointmentId, { status: newStatus } as Record<string, unknown> & { status?: string });
      message.success("Appointment updated");
      if (selectedUser) selectUser(selectedUser);
    } catch (err) {
      message.error((err as Error)?.message || "Failed to update appointment");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const viewUserDetails = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedUser(null)}>
          Back
        </Button>
        <Title level={4} style={{ margin: 0 }}>{selectedUser?.name}</Title>
      </div>

      {resourceLoading ? (
        <Spin size="large" />
      ) : (
        <div>
          <Card title="Profile Summary" style={{ borderRadius: 16, marginBottom: 24 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Email">{selectedUser?.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{selectedUser?.phone || "-"}</Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {selectedUser?.dateOfBirth ? dayjs(selectedUser.dateOfBirth).format("MMM D, YYYY") : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Age">
                {selectedUser?.age ?? (selectedUser?.dateOfBirth ? dayjs().diff(dayjs(selectedUser.dateOfBirth), "year") : "-")}
              </Descriptions.Item>
              <Descriptions.Item label="Blood Group">{selectedUser?.bloodGroup || "-"}</Descriptions.Item>
              <Descriptions.Item label="Gender">
                {selectedUser?.gender ? selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1) : "-"}
              </Descriptions.Item>
              <Descriptions.Item label="Address">{selectedUser?.address || "-"}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card
            title={<span><CalendarOutlined style={{ marginRight: 8 }} />Appointments ({appointments.length})</span>}
            style={{ borderRadius: 16, marginBottom: 24 }}
          >
            <Table
              dataSource={appointments}
              rowKey="_id"
              pagination={false}
              size="small"
              columns={[
                { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
                { title: "Date", dataIndex: "appointmentDate", key: "appointmentDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (s: string, record: Appointment) => (
                    <Space size="small" orientation="vertical" style={{ gap: 4 }}>
                      <Tag color={statusColors[s] || "default"}>{formatStatus(s)}</Tag>
                      {s === "scheduled" && (
                        <Button size="small" onClick={() => handleStatusChange(record._id, "completed")}>Complete</Button>
                      )}
                    </Space>
                  ),
                },
                {
                  title: "Notes",
                  key: "notes",
                  width: 220,
                  render: (_: unknown, record: Appointment) => {
                    const notes: string[] = [];
                    if (record.tokenNumber) notes.push(`Token: ${record.tokenNumber}`);
                    if (record.finalNotes) notes.push(record.finalNotes);
                    if (record.reviewNotes) notes.push(record.reviewNotes);
                    if (record.confirmationNotes) notes.push(`User: ${record.confirmationNotes}`);
                    if (record.feedbackNotes) notes.push(`Feedback: ${record.feedbackNotes}`);
                    if (record.cancelledBy) notes.push(`Cancelled by: ${record.cancelledBy}`);
                    if (notes.length === 0) return <span style={{ color: colors.textSecondary }}>-</span>;
                    return (
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>
                        {notes.map((n, i) => (
                          <div key={i} style={{ marginBottom: i < notes.length - 1 ? 4 : 0 }}>{n}</div>
                        ))}
                      </div>
                    );
                  },
                },
                {
                  title: "Review",
                  key: "review",
                  width: 200,
                  render: (_: unknown, record: Appointment) =>
                    record.status === "pending" ? (
                      <Space>
                        <Button type="primary" size="small" onClick={() => openReview(record, "scheduled")}>
                          Approve
                        </Button>
                        <Button danger size="small" onClick={() => openReview(record, "rejected")}>
                          Reject
                        </Button>
                      </Space>
                    ) : record.status === "pending_confirmation" ? (
                      <span style={{ color: "#d97706", fontSize: 12 }}>Awaiting user confirmation</span>
                    ) : record.status === "user_confirmed" ? (
                      <Button type="primary" size="small" onClick={() => openFinalize(record)}>
                        Finalize with hospital
                      </Button>
                    ) : record.status === "cancellation_requested" ? (
                      <Space>
                        <Button type="primary" size="small" onClick={async () => {
                          try {
                            await approveCancellation(record._id);
                            message.success("Cancellation approved");
                            if (selectedUser) selectUser(selectedUser);
                          } catch (err) {
                            message.error((err as Error)?.message || "Failed to approve cancellation");
                          }
                        }}>
                          Approve Cancel
                        </Button>
                        <Button size="small" onClick={async () => {
                          try {
                            await rejectCancellation(record._id);
                            message.success("Cancellation rejected");
                            if (selectedUser) selectUser(selectedUser);
                          } catch (err) {
                            message.error((err as Error)?.message || "Failed to reject cancellation");
                          }
                        }}>
                          Reject Cancel
                        </Button>
                      </Space>
                    ) : record.status === "feedback_provided" ? (
                      <Button type="primary" size="small" onClick={async () => {
                        try {
                          await closeAppointment(record._id);
                          message.success("Appointment closed");
                          if (selectedUser) selectUser(selectedUser);
                        } catch (err) {
                          message.error((err as Error)?.message || "Failed to close appointment");
                        }
                      }}>
                        Close
                      </Button>
                    ) : (
                      <span style={{ color: colors.textSecondary }}>-</span>
                    ),
                },
              ]}
            />
          </Card>

          <Row gutter={20}>
            <Col span={12}>
              <Card
                title={<span><HeartOutlined style={{ marginRight: 8 }} />Medical Conditions ({conditions.length})</span>}
                style={{ borderRadius: 16, marginBottom: 24 }}
              >
                <Table
                  dataSource={conditions}
                  rowKey="_id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: "Condition", dataIndex: "condition", key: "condition" },
                    { title: "Diagnosed", dataIndex: "diagnosedDate", key: "diagnosedDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                    { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true },
                  ]}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card
                title={<span><MedicineBoxOutlined style={{ marginRight: 8 }} />Medications ({medications.length})</span>}
                style={{ borderRadius: 16, marginBottom: 24 }}
              >
                <Table
                  dataSource={medications}
                  rowKey="_id"
                  pagination={false}
                  size="small"
                  columns={[
                    { title: "Medicine", dataIndex: "medicineName", key: "medicineName" },
                    { title: "Dosage", dataIndex: "dosage", key: "dosage" },
                    { title: "Frequency", dataIndex: "frequency", key: "frequency" },
                  ]}
                />
              </Card>
            </Col>
          </Row>

          <Card
            title={<span><PhoneOutlined style={{ marginRight: 8 }} />Emergency Contacts ({contacts.length})</span>}
            style={{ borderRadius: 16 }}
          >
            <Table
              dataSource={contacts}
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
          </Card>

          <div style={{ marginTop: 24 }}>
            <VitalsSection userId={selectedUser?._id || selectedUser?.id} />
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (selectedUser) return viewUserDetails();

    switch (activeKey) {
      case "1":
        return (
          <div>
            {/* Row 1: My Activity */}
            <Card style={{ borderRadius: 16, marginBottom: 20 }} size="small">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, textAlign: "center", background: "#f0f7ff" }} size="small">
                    <Statistic title="Proposed" value={dashboardData?.myActivity?.appointmentsProposed ?? 0} prefix={<CalendarOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, textAlign: "center", background: "#f0fdf4" }} size="small">
                    <Statistic title="Reviewed" value={dashboardData?.myActivity?.appointmentsReviewed ?? 0} prefix={<EyeOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, textAlign: "center", background: "#fffbeb" }} size="small">
                    <Statistic title="Finalized" value={dashboardData?.myActivity?.appointmentsFinalized ?? 0} prefix={<CheckCircleOutlined />} />
                  </Card>
                </Col>
                <Col xs={12} sm={6}>
                  <Card style={{ borderRadius: 12, textAlign: "center", background: "#fef2f2" }} size="small">
                    <Statistic title="Closed" value={dashboardData?.myActivity?.appointmentsClosed ?? 0} prefix={<ClockCircleOutlined />} />
                  </Card>
                </Col>
              </Row>
            </Card>

            {/* Row 2: Resolution Rate + Pending */}
            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 16 }} size="small">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Typography.Text strong>Resolution Rate</Typography.Text>
                    <Typography.Text strong style={{ fontSize: 20, color: (dashboardData?.appointmentStats?.resolutionRate ?? 0) >= 70 ? "#10b981" : "#ef4444" }}>
                      {dashboardData?.appointmentStats?.resolutionRate ?? 0}%
                    </Typography.Text>
                  </div>
                  <Progress
                    percent={dashboardData?.appointmentStats?.resolutionRate ?? 0}
                    strokeColor={(dashboardData?.appointmentStats?.resolutionRate ?? 0) >= 70 ? "#10b981" : "#ef4444"}
                    railColor="#f0f0f0"
                    size="small"
                    showInfo={false}
                  />
                  <div style={{ marginTop: 4, fontSize: 12, color: colors.textSecondary }}>
                    {dashboardData?.appointmentStats?.resolved ?? 0} resolved / {dashboardData?.appointmentStats?.nonCancelled ?? 0} non-cancelled
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 16, textAlign: "center" }} size="small">
                  <Space>
                    <ClockCircleOutlined style={{ color: "#ef4444", fontSize: 18 }} />
                    <Typography.Text strong style={{ fontSize: 18, color: "#ef4444" }}>
                    {(dashboardData?.pendingActions?.pendingReview ?? 0) +
                       (dashboardData?.pendingActions?.awaitingFeedback ?? 0) +
                       (dashboardData?.pendingActions?.feedbackToClose ?? 0) +
                       (dashboardData?.pendingActions?.cancellationRequests ?? 0)}
                    </Typography.Text>
                    <Typography.Text>Pending Actions</Typography.Text>
                  </Space>
                  <div style={{ marginTop: 6, display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
                    {dashboardData?.pendingActions?.pendingReview ? <Tag color="red">{dashboardData.pendingActions.pendingReview} to review</Tag> : null}
                    {dashboardData?.pendingActions?.awaitingFeedback ? <Tag color="orange">{dashboardData.pendingActions.awaitingFeedback} awaiting feedback</Tag> : null}
                    {dashboardData?.pendingActions?.feedbackToClose ? <Tag color="blue">{dashboardData.pendingActions.feedbackToClose} to close</Tag> : null}
                    {dashboardData?.pendingActions?.cancellationRequests ? <Tag color="volcano">{dashboardData.pendingActions.cancellationRequests} cancellations</Tag> : null}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Row 3: Today's Schedule */}
            <Card
              title={<span><CalendarOutlined style={{ marginRight: 8 }} />Today's Schedule ({dashboardData?.todaySchedule?.total ?? 0})</span>}
              style={{ borderRadius: 16, marginBottom: 20 }}
              size="small"
            >
              {dashboardData?.todaySchedule?.appointments?.length ? (
                dashboardData.todaySchedule.appointments.map((appt) => (
                  <div key={appt._id} style={{ padding: "8px 0", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors.primary, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                      <Typography.Text strong style={{ fontSize: 13 }}>
                        {appt.appointmentDate ? dayjs(appt.appointmentDate).format("h:mm A") : "—"}
                      </Typography.Text>
                      <span style={{ margin: "0 8px", color: colors.textSecondary }}>—</span>
                      <Typography.Text style={{ fontSize: 13 }}>{appt.user?.name || "Unknown"}</Typography.Text>
                      <span style={{ margin: "0 8px", color: colors.textSecondary }}>—</span>
                      <Typography.Text style={{ fontSize: 13, color: colors.textSecondary }}>{appt.doctorName}</Typography.Text>
                      {appt.tokenNumber && (
                        <Tag color="blue" style={{ marginLeft: 8, fontSize: 10 }}>Token #{appt.tokenNumber}</Tag>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: 13 }}>No appointments scheduled today.</Paragraph>
              )}
            </Card>

            {/* Row 4: Assigned Users */}
            <Card
              title={<span><TeamOutlined style={{ marginRight: 8 }} />Assigned Users ({dashboardData?.assignedUsers?.total ?? assignedUsers.length})</span>}
              style={{ borderRadius: 16 }}
              size="small"
            >
              {(dashboardData?.assignedUsers?.list || assignedUsers).length > 0 ? (
                (dashboardData?.assignedUsers?.list || assignedUsers).map((u) => (
                  <div key={u._id || u.id} style={{ padding: "10px 0", borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar size={36} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Typography.Text strong style={{ fontSize: 13 }}>{u.name}</Typography.Text>
                        <Tag color={u.verificationStatus === "verified" ? "green" : u.verificationStatus === "rejected" ? "red" : "orange"} style={{ fontSize: 10 }}>
                          {u.verificationStatus === "verified" ? "Verified" : u.verificationStatus || "Pending"}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {u.bloodGroup && <span>{u.bloodGroup}  |  </span>}
                        {u.phone && <span>{u.phone}</span>}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: 13 }}>No users assigned yet.</Paragraph>
              )}
            </Card>

            {/* My Feedback */}
            <Card
              title={<span><StarOutlined style={{ marginRight: 8 }} />My Feedback</span>}
              style={{ borderRadius: 16, marginTop: 20 }}
              size="small"
              loading={ratingLoading}
            >
              {myRating ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 32, fontWeight: 700, color: "#faad14" }}>{myRating.averageRating.toFixed(1)}</div>
                      <Rate disabled value={Math.round(myRating.averageRating)} style={{ fontSize: 14 }} />
                      <div style={{ fontSize: 12, color: colors.textSecondary }}>{myRating.totalReviews} reviews</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const key = `${star}star` as keyof typeof myRating.breakdown;
                        const count = myRating.breakdown?.[key] || 0;
                        const pct = myRating.totalReviews > 0 ? Math.round((count / myRating.totalReviews) * 100) : 0;
                        return (
                          <div key={star} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 12, width: 30 }}>{star}★</span>
                            <Progress percent={pct} showInfo={false} size="small" strokeColor="#faad14" style={{ flex: 1, margin: 0 }} />
                            <span style={{ fontSize: 11, width: 20, textAlign: "right" }}>{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {myRating.reviews && myRating.reviews.slice(0, 3).map((r) => (
                    <div key={r._id} style={{ padding: "8px 0", borderTop: "1px solid #f5f5f5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Space>
                          <Typography.Text style={{ fontSize: 12 }}>Anonymous</Typography.Text>
                          <Rate disabled value={r.rating} style={{ fontSize: 11 }} />
                        </Space>
                        <Typography.Text style={{ fontSize: 11, color: colors.textSecondary }}>
                          {dayjs(r.createdAt).format("MMM D")}
                        </Typography.Text>
                      </div>
                      {r.comments && <Typography.Text style={{ fontSize: 12, display: "block", marginTop: 2 }}>"{r.comments}"</Typography.Text>}
                    </div>
                  ))}
                </div>
              ) : (
                <Paragraph style={{ color: colors.textSecondary, margin: 0, fontSize: 13 }}>No feedback yet.</Paragraph>
              )}
            </Card>
          </div>
        );
      case "2":
        return (
          <div>
            <Card style={{ borderRadius: 16 }}>
              {assignedUsers.length === 0 ? (
                <Paragraph style={{ color: colors.textSecondary, textAlign: "center", padding: 40 }}>
                  No users assigned yet.
                </Paragraph>
              ) : (
                <Table
                  dataSource={assignedUsers}
                  rowKey={(r) => r._id || r.id}
                  loading={loading}
                  columns={[
                    { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
                    { title: "Email", dataIndex: "email", key: "email" },
                    { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
                    {
                      title: "Status",
                      dataIndex: "verificationStatus",
                      key: "verificationStatus",
                      render: (s: string) => {
                        const vc: Record<string, string> = { pending: "orange", verified: "green", rejected: "red" };
                        return <Tag color={vc[s] || "default"}>{s || "pending"}</Tag>;
                      },
                    },
                    {
                      title: "Action",
                      key: "action",
                      render: (_: unknown, record: User) => (
                        <Button type="primary" size="small" onClick={() => selectUser(record)}>
                          View & Manage
                        </Button>
                      ),
                    },
                  ]}
                />
              )}
            </Card>
          </div>
        );
      case "3":
        return (
          <div>
            <Card style={{ borderRadius: 16 }}>
              {pendingAppointments.length === 0 ? (
                <Paragraph style={{ color: colors.textSecondary, textAlign: "center", padding: 40 }}>
                  No pending requests. New appointment requests and user-confirmed proposals awaiting finalization will appear here.
                </Paragraph>
              ) : (
                <Table
                  dataSource={pendingAppointments}
                  rowKey="_id"
                  loading={pendingLoading}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  columns={[
                    {
                      title: "User",
                      key: "user",
                      render: (_: unknown, record: Appointment) => (
                        <strong>{record.user?.name || "-"}</strong>
                      ),
                    },
                    { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
                    { title: "Hospital", dataIndex: "hospital", key: "hospital", render: (v: string) => v || "-" },
                    {
                      title: "Date",
                      dataIndex: "appointmentDate",
                      key: "appointmentDate",
                      render: (d: string) => (d ? dayjs(d).format("MMM D, YYYY") : "-"),
                    },
                    { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
                    {
                      title: "Status",
                      dataIndex: "status",
                      key: "status",
                      render: (s: AppointmentStatus) => (
                        <Tag color={statusColors[s] || "default"}>{formatStatus(s)}</Tag>
                      ),
                    },
                    {
                      title: "Actions",
                      key: "actions",
                      width: 320,
                      render: (_: unknown, record: Appointment) => {
                        const u = assignedUsers.find((x) => (x._id || x.id) === record.user?._id);
                        return (
                          <Space wrap>
                            {record.status === "pending" ? (
                              <>
                                <Button type="primary" size="small" onClick={() => openReview(record, "scheduled")}>
                                  Approve
                                </Button>
                                <Button danger size="small" onClick={() => openReview(record, "rejected")}>
                                  Reject
                                </Button>
                                <Button size="small" onClick={() => openPropose(record)}>
                                  Propose New
                                </Button>
                              </>
                            ) : record.status === "user_confirmed" ? (
                              <Button type="primary" size="small" onClick={() => openFinalize(record)}>
                                Finalize with hospital
                              </Button>
                            ) : record.status === "cancellation_requested" ? (
                              <>
                                <Button type="primary" size="small" onClick={async () => {
                                  try {
                                    await approveCancellation(record._id);
                                    message.success("Cancellation approved");
                                    fetchPendingAppointments(assignedUsers);
                                  } catch (err) {
                                    message.error((err as Error)?.message || "Failed to approve cancellation");
                                  }
                                }}>
                                  Approve Cancel
                                </Button>
                                <Button size="small" onClick={async () => {
                                  try {
                                    await rejectCancellation(record._id);
                                    message.success("Cancellation rejected");
                                    fetchPendingAppointments(assignedUsers);
                                  } catch (err) {
                                    message.error((err as Error)?.message || "Failed to reject cancellation");
                                  }
                                }}>
                                  Reject Cancel
                                </Button>
                              </>
                            ) : record.status === "feedback_provided" ? (
                              <Button type="primary" size="small" onClick={async () => {
                                try {
                                  await closeAppointment(record._id);
                                  message.success("Appointment closed");
                                  fetchPendingAppointments(assignedUsers);
                                } catch (err) {
                                  message.error((err as Error)?.message || "Failed to close appointment");
                                }
                              }}>
                                Close
                              </Button>
                            ) : null}
                            {u && (
                              <Button size="small" icon={<EyeOutlined />} onClick={() => selectUser(u)}>
                                View Profile
                              </Button>
                            )}
                          </Space>
                        );
                      },
                    },
                  ]}
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
                <Title level={4} style={{ color: colors.secondary, margin: 0 }}>Elder Care Staff</Title>
              </div>
              <Menu
                mode="inline"
                selectedKeys={selectedUser ? [] : [activeKey]}
                onClick={({ key }) => handleMenuClick(key)}
                items={[
                  { key: "1", icon: <HomeOutlined />, label: "Dashboard" },
                  { key: "2", icon: <TeamOutlined />, label: `Assigned Users (${assignedUsers.length})` },
                  { key: "3", icon: <ClockCircleOutlined />, label: <span>Pending Requests {pendingAppointments.length > 0 ? <span style={{ color: "#ef4444", fontWeight: 600 }}>({pendingAppointments.length})</span> : `(${pendingAppointments.length})`}</span> },
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
              {selectedUser
                ? selectedUser.name
                : activeKey === "1"
                ? "Dashboard"
                : activeKey === "2"
                ? "Assigned Users"
                : "Pending Requests"}
            </Title>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Tag color="blue">Staff</Tag>
              <Avatar size={50} src={user.profileImage} icon={<UserOutlined />} />
            </div>
          </div>

          {renderContent()}
        </Content>
      </Layout>

      <Modal
        title={reviewStatus === "scheduled" ? "Approve & Schedule Appointment" : "Reject Appointment"}
        open={reviewModalOpen}
        onCancel={() => setReviewModalOpen(false)}
        onOk={submitReview}
        confirmLoading={reviewSubmitting}
        okText={reviewStatus === "scheduled" ? "Approve" : "Reject"}
        okButtonProps={reviewStatus === "rejected" ? { danger: true } : undefined}
        destroyOnHidden
      >
        {reviewingAppointment && (
          <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8 }}>
            <Paragraph strong style={{ marginBottom: 4 }}>{reviewingAppointment.doctorName}</Paragraph>
            <Paragraph style={{ marginBottom: 0, color: colors.textSecondary, fontSize: 13 }}>
              {reviewingAppointment.appointmentDate ? dayjs(reviewingAppointment.appointmentDate).format("MMM D, YYYY") : "-"}
              {reviewingAppointment.hospital ? ` — ${reviewingAppointment.hospital}` : ""}
            </Paragraph>
          </div>
        )}
        <Form layout="vertical">
          {reviewStatus === "scheduled" && (
            <Form.Item label="Token number" required>
              <Input
                value={reviewTokenNumber}
                onChange={(e) => setReviewTokenNumber(e.target.value)}
                placeholder="e.g. TK-045"
              />
            </Form.Item>
          )}
          <Form.Item
            label={reviewStatus === "scheduled" ? "Instructions (optional)" : "Reason for rejection"}
            required={reviewStatus === "rejected"}
          >
            <Input.TextArea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                reviewStatus === "scheduled"
                  ? "e.g. Please arrive 15 min early. Bring previous reports."
                  : "Explain why this appointment is being rejected"
              }
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Propose New Appointment"
        open={proposeModalOpen}
        onCancel={() => {
          setReplacingAppointment(null);
          setProposeModalOpen(false);
        }}
        footer={null}
        destroyOnHidden
      >
        {replacingAppointment && (
          <Paragraph
            style={{
              color: "#ef4444",
              marginBottom: 12,
              padding: 8,
              background: "#fef2f2",
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            The previous appointment with{" "}
            <strong>{replacingAppointment.doctorName}</strong> will be
            automatically rejected when you send this proposal.
          </Paragraph>
        )}
        <Paragraph style={{ color: colors.textSecondary, marginBottom: 16 }}>
          The patient will see this as a proposal and can accept or decline it.
        </Paragraph>
        <Form
          form={proposeForm}
          layout="vertical"
          onFinish={submitPropose}
          style={{ marginTop: 8 }}
        >
          <Form.Item name="doctorName" label="Doctor Name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Dr. Smith" />
          </Form.Item>
          <Form.Item name="hospital" label="Hospital / Clinic">
            <Select
              placeholder="Select a hospital"
              allowClear
              showSearch
              optionFilterProp="label"
              notFoundContent={hospitals.length === 0 ? "No hospitals available" : "No matches"}
              options={hospitals.map((h) => ({
                value: h.name,
                label: h.address ? `${h.name} — ${h.address}` : h.name,
              }))}
            />
          </Form.Item>
          <Form.Item name="appointmentDate" label="Appointment Date" rules={[{ required: true, message: "Required" }]}>
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => !!current && current < dayjs().endOf("day")}
            />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Required" }]}>
            <Input.TextArea rows={2} placeholder="Reason for the appointment" />
          </Form.Item>
          <Form.Item name="reviewNotes" label="Message to patient">
            <Input.TextArea rows={2} placeholder="e.g. Doctor isn't available on the 15th. Is the 20th ok?" />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setProposeModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={proposeSubmitting}>
              Send Proposal
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Finalize Appointment with Hospital"
        open={finalizeModalOpen}
        onCancel={() => setFinalizeModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        {finalizingAppointment && (
          <div style={{ marginBottom: 16, padding: 12, background: "#f5f3ff", borderRadius: 8 }}>
            <Paragraph strong style={{ marginBottom: 4 }}>{finalizingAppointment.doctorName}</Paragraph>
            <Paragraph style={{ marginBottom: 0, color: colors.textSecondary, fontSize: 13 }}>
              {finalizingAppointment.appointmentDate ? dayjs(finalizingAppointment.appointmentDate).format("MMM D, YYYY") : "-"}
              {finalizingAppointment.hospital ? ` — ${finalizingAppointment.hospital}` : ""}
            </Paragraph>
            <Tag color="purple" style={{ marginTop: 8 }}>User confirmed</Tag>
          </div>
        )}
        <Paragraph style={{ color: colors.textSecondary, marginBottom: 16 }}>
          Call the hospital to book the slot, then record the token number and any
          instructions. The patient will see these details once finalized.
        </Paragraph>
        <Form
          form={finalizeForm}
          layout="vertical"
          onFinish={submitFinalize}
          style={{ marginTop: 8 }}
        >
          <Form.Item
            name="tokenNumber"
            label="Token number"
            rules={[{ required: true, message: "Token number is required" }]}
          >
            <Input placeholder="e.g. TK-045" />
          </Form.Item>
          <Form.Item name="appointmentDate" label="Confirmed date (optional)">
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => !!current && current < dayjs().endOf("day")}
            />
          </Form.Item>
          <Form.Item name="finalNotes" label="Instructions from hospital (optional)">
            <Input.TextArea rows={2} placeholder="e.g. Bring previous reports. Arrive 15 min early." />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setFinalizeModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={finalizeSubmitting}>
              Finalize &amp; Schedule
            </Button>
          </div>
        </Form>
      </Modal>
    </motion.div>
  );
}
