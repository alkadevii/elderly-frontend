"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Descriptions,
  Spin,
  message,
  Typography,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { colors } from "@/styles/theme";
import type { User } from "@/types/User";
import type { Appointment } from "@/types/Appointment";
import type { EmergencyContact } from "@/types/EmergencyContact";
import type { MedicalCondition } from "@/types/MedicalCondition";
import type { Medication } from "@/types/Medication";
import type { Hospital } from "@/types/Hospital";
import { getAssignedUsers } from "@/services/adminService";
import {
  getAppointments,
  reviewAppointment,
  createAppointment,
  finalizeAppointment,
  updateAppointment,
  approveCancellation,
  rejectCancellation,
  closeAppointment,
} from "@/services/appointmentService";
import { getHospitals } from "@/services/hospitalService";
import { getEmergencyContacts } from "@/services/emergencyContactService";
import { getMedicalConditions } from "@/services/medicalConditionService";
import { getMedications } from "@/services/medicationService";
import VitalsSection from "@/components/Dashboard/VitalsSection";

const { Title, Paragraph } = Typography;

const statusColors: Record<string, string> = {
  pending: "blue", pending_confirmation: "orange", user_confirmed: "purple",
  approved: "green", scheduled: "cyan", awaiting_feedback: "orange",
  feedback_provided: "geekblue", completed: "default", cancelled: "red",
  rejected: "red", cancellation_requested: "volcano",
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function StaffAssignedUsersPage() {
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [resourceLoading, setResourceLoading] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const assignedRes = await getAssignedUsers();
        if (!cancelled) {
          setAssignedUsers(Array.isArray(assignedRes) ? assignedRes : []);
        }
      } catch {
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

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
      await reviewAppointment(reviewingAppointment._id, {
        status: reviewStatus,
        reviewNotes: reviewNotes.trim() || undefined,
        tokenNumber: reviewStatus === "scheduled" ? reviewTokenNumber.trim() : undefined,
      });
      message.success(`Appointment ${reviewStatus}`);
      setReviewModalOpen(false);
      if (selectedUser) selectUser(selectedUser);
    } catch (err) {
      message.error((err as Error)?.message || "Failed to review appointment");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openPropose = (appointment?: Appointment) => {
    const userId = appointment?.user?._id || (selectedUser ? selectedUser._id || selectedUser.id : undefined);
    if (!userId) {
      message.error("No patient selected to propose an appointment for");
      return;
    }
    setProposingForUserId(userId);
    setReplacingAppointment(appointment && appointment.status !== "rejected" ? appointment : null);
    if (hospitals.length === 0) {
      getHospitals(true).then((res) => {
        const list = Array.isArray(res) ? res : (res.data || res.hospitals || []);
        setHospitals((list as Hospital[]).filter((h) => h.isActive));
      }).catch(() => {});
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
      message.success(replacing ? "Previous appointment rejected & new proposal sent" : "Appointment proposed");
      setReplacingAppointment(null);
      setProposeModalOpen(false);
      if (selectedUser) selectUser(selectedUser);
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
      const payload: { tokenNumber: string; appointmentDate?: string; finalNotes?: string } = { tokenNumber };
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

  const viewUserDetails = () => {
    if (!selectedUser) return null;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => setSelectedUser(null)}>Back</Button>
          <Title level={4} style={{ margin: 0 }}>{selectedUser.name}</Title>
        </div>
        {resourceLoading ? (
          <Spin size="large" />
        ) : (
          <div>
            <Card title="Profile Summary" style={{ borderRadius: 16, marginBottom: 24 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{selectedUser.phone || "-"}</Descriptions.Item>
                <Descriptions.Item label="Date of Birth">
                  {selectedUser.dateOfBirth ? dayjs(selectedUser.dateOfBirth).format("MMM D, YYYY") : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Age">
                  {selectedUser.age ?? (selectedUser.dateOfBirth ? dayjs().diff(dayjs(selectedUser.dateOfBirth), "year") : "-")}
                </Descriptions.Item>
                <Descriptions.Item label="Blood Group">{selectedUser.bloodGroup || "-"}</Descriptions.Item>
                <Descriptions.Item label="Gender">
                  {selectedUser.gender ? selectedUser.gender.charAt(0).toUpperCase() + selectedUser.gender.slice(1) : "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Address">{selectedUser.address || "-"}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title={<span><CalendarOutlined style={{ marginRight: 8 }} />Appointments ({appointments.length})</span>} style={{ borderRadius: 16, marginBottom: 24 }}>
              <Table dataSource={appointments} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                columns={[
                  { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
                  { title: "Date", dataIndex: "appointmentDate", key: "appointmentDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                  { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
                  {
                    title: "Status", dataIndex: "status", key: "status",
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
                    title: "Notes", key: "notes", width: 220,
                    render: (_: unknown, record: Appointment) => {
                      const notes: string[] = [];
                      if (record.tokenNumber) notes.push(`Token: ${record.tokenNumber}`);
                      if (record.finalNotes) notes.push(record.finalNotes);
                      if (record.reviewNotes) notes.push(record.reviewNotes);
                      if (record.confirmationNotes) notes.push(`User: ${record.confirmationNotes}`);
                      if (record.feedbackNotes) notes.push(`Feedback: ${record.feedbackNotes}`);
                      if (record.cancelledBy) notes.push(`Cancelled by: ${record.cancelledBy}`);
                      if (notes.length === 0) return <span style={{ color: colors.textSecondary }}>-</span>;
                      return <div style={{ fontSize: 12, color: colors.textSecondary }}>
                        {notes.map((n, i) => <div key={i} style={{ marginBottom: i < notes.length - 1 ? 4 : 0 }}>{n}</div>)}
                      </div>;
                    },
                  },
                  {
                    title: "Review", key: "review", width: 200,
                    render: (_: unknown, record: Appointment) =>
                      record.status === "pending" ? (
                        <Space>
                          <Button type="primary" size="small" onClick={() => openReview(record, "scheduled")}>Approve</Button>
                          <Button danger size="small" onClick={() => openReview(record, "rejected")}>Reject</Button>
                        </Space>
                      ) : record.status === "pending_confirmation" ? (
                        <span style={{ color: "#d97706", fontSize: 12 }}>Awaiting user confirmation</span>
                      ) : record.status === "user_confirmed" ? (
                        <Button type="primary" size="small" onClick={() => openFinalize(record)}>Finalize with hospital</Button>
                      ) : record.status === "cancellation_requested" ? (
                        <Space>
                          <Button type="primary" size="small" onClick={async () => {
                            try { await approveCancellation(record._id); message.success("Cancellation approved"); if (selectedUser) selectUser(selectedUser); }
                            catch (err) { message.error((err as Error)?.message || "Failed"); }
                          }}>Approve Cancel</Button>
                          <Button size="small" onClick={async () => {
                            try { await rejectCancellation(record._id); message.success("Cancellation rejected"); if (selectedUser) selectUser(selectedUser); }
                            catch (err) { message.error((err as Error)?.message || "Failed"); }
                          }}>Reject Cancel</Button>
                        </Space>
                      ) : record.status === "feedback_provided" ? (
                        <Button type="primary" size="small" onClick={async () => {
                          try { await closeAppointment(record._id); message.success("Appointment closed"); if (selectedUser) selectUser(selectedUser); }
                          catch (err) { message.error((err as Error)?.message || "Failed"); }
                        }}>Close</Button>
                      ) : (
                        <span style={{ color: colors.textSecondary }}>-</span>
                      ),
                  },
                ]}
              />
            </Card>

            <Row gutter={[12, 12]}>
              <Col xs={24} lg={12}>
                <Card title={<span><HeartOutlined style={{ marginRight: 8 }} />Medical Conditions ({conditions.length})</span>} style={{ borderRadius: 16, marginBottom: 24 }}>
                  <Table dataSource={conditions} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                    columns={[
                      { title: "Condition", dataIndex: "condition", key: "condition" },
                      { title: "Diagnosed", dataIndex: "diagnosedDate", key: "diagnosedDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
                      { title: "Notes", dataIndex: "notes", key: "notes", ellipsis: true },
                    ]}
                  />
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title={<span><MedicineBoxOutlined style={{ marginRight: 8 }} />Medications ({medications.length})</span>} style={{ borderRadius: 16, marginBottom: 24 }}>
                  <Table dataSource={medications} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                    columns={[
                      { title: "Medicine", dataIndex: "medicineName", key: "medicineName" },
                      { title: "Dosage", dataIndex: "dosage", key: "dosage" },
                      { title: "Frequency", dataIndex: "frequency", key: "frequency" },
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            <Card title={<span><PhoneOutlined style={{ marginRight: 8 }} />Emergency Contacts ({contacts.length})</span>} style={{ borderRadius: 16 }}>
              <Table dataSource={contacts} rowKey="_id" pagination={false} size="small" scroll={{ x: 'max-content' }}
                columns={[
                  { title: "Name", dataIndex: "name", key: "name" },
                  { title: "Relationship", dataIndex: "relationship", key: "relationship" },
                  { title: "Phone", dataIndex: "phone", key: "phone" },
                  { title: "Email", dataIndex: "email", key: "email", render: (v: string) => v || "-" },
                ]}
              />
            </Card>

            <div style={{ marginTop: 24 }}>
              <VitalsSection userId={selectedUser._id || selectedUser.id} />
            </div>
          </div>
        )}
      </div>
    );
  };

  if (selectedUser) return viewUserDetails();

  return (
    <div>
      <Card style={{ borderRadius: 16 }}>
        {assignedUsers.length === 0 ? (
          <Paragraph style={{ color: colors.textSecondary, textAlign: "center", padding: 40 }}>No users assigned yet.</Paragraph>
        ) : (
          <Table
            dataSource={assignedUsers}
            rowKey={(r) => r._id || r.id}
            loading={loading}
            scroll={{ x: 'max-content' }}
            columns={[
              { title: "Name", dataIndex: "name", key: "name", render: (name: string) => <strong>{name}</strong> },
              { title: "Email", dataIndex: "email", key: "email" },
              { title: "Phone", dataIndex: "phone", key: "phone", render: (v: string) => v || "-" },
              {
                title: "Status", dataIndex: "verificationStatus", key: "verificationStatus",
                render: (s: string) => {
                  const vc: Record<string, string> = { pending: "orange", verified: "green", rejected: "red" };
                  return <Tag color={vc[s] || "default"}>{s || "pending"}</Tag>;
                },
              },
              {
                title: "Action", key: "action",
                render: (_: unknown, record: User) => (
                  <Button type="primary" size="small" onClick={() => selectUser(record)}>View & Manage</Button>
                ),
              },
            ]}
          />
        )}
      </Card>

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
              <Input value={reviewTokenNumber} onChange={(e) => setReviewTokenNumber(e.target.value)} placeholder="e.g. TK-045" />
            </Form.Item>
          )}
          <Form.Item label={reviewStatus === "scheduled" ? "Instructions (optional)" : "Reason for rejection"} required={reviewStatus === "rejected"}>
            <Input.TextArea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewStatus === "scheduled" ? "e.g. Please arrive 15 min early." : "Explain why this appointment is being rejected"}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Propose New Appointment"
        open={proposeModalOpen}
        onCancel={() => { setReplacingAppointment(null); setProposeModalOpen(false); }}
        footer={null}
        destroyOnHidden
      >
        {replacingAppointment && (
          <Paragraph style={{ color: "#ef4444", marginBottom: 12, padding: 8, background: "#fef2f2", borderRadius: 8, fontSize: 13 }}>
            The previous appointment with <strong>{replacingAppointment.doctorName}</strong> will be automatically rejected.
          </Paragraph>
        )}
        <Paragraph style={{ color: colors.textSecondary, marginBottom: 16 }}>
          The patient will see this as a proposal and can accept or decline it.
        </Paragraph>
        <Form form={proposeForm} layout="vertical" onFinish={submitPropose} style={{ marginTop: 8 }}>
          <Form.Item name="doctorName" label="Doctor Name" rules={[{ required: true, message: "Required" }]}>
            <Input placeholder="Dr. Smith" />
          </Form.Item>
          <Form.Item name="hospital" label="Hospital / Clinic">
            <Select placeholder="Select a hospital" allowClear showSearch optionFilterProp="label"
              notFoundContent={hospitals.length === 0 ? "No hospitals available" : "No matches"}
              options={hospitals.map((h) => ({ value: h.name, label: h.address ? `${h.name} — ${h.address}` : h.name }))}
            />
          </Form.Item>
          <Form.Item name="appointmentDate" label="Appointment Date" rules={[{ required: true, message: "Required" }]}>
            <DatePicker style={{ width: "100%" }} disabledDate={(current) => !!current && current < dayjs().endOf("day")} />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true, message: "Required" }]}>
            <Input.TextArea rows={2} placeholder="Reason for the appointment" />
          </Form.Item>
          <Form.Item name="reviewNotes" label="Message to patient">
            <Input.TextArea rows={2} placeholder="e.g. Doctor isn't available on the 15th. Is the 20th ok?" />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setReplacingAppointment(null); setProposeModalOpen(false); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={proposeSubmitting}>Send Proposal</Button>
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
        <Form form={finalizeForm} layout="vertical" onFinish={submitFinalize} style={{ marginTop: 8 }}>
          <Form.Item name="tokenNumber" label="Token number" rules={[{ required: true, message: "Token number is required" }]}>
            <Input placeholder="e.g. TK-045" />
          </Form.Item>
          <Form.Item name="appointmentDate" label="Confirmed date (optional)">
            <DatePicker style={{ width: "100%" }} disabledDate={(current) => !!current && current < dayjs().endOf("day")} />
          </Form.Item>
          <Form.Item name="finalNotes" label="Instructions from hospital (optional)">
            <Input.TextArea rows={2} placeholder="e.g. Bring previous reports. Arrive 15 min early." />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setFinalizeModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={finalizeSubmitting}>Finalize & Schedule</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
