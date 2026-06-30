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
  DatePicker,
  Select,
  Spin,
  message,
  Typography,
} from "antd";
import {
  EyeOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { colors } from "@/styles/theme";
import type { User } from "@/types/User";
import type { Appointment, AppointmentStatus } from "@/types/Appointment";
import type { Hospital } from "@/types/Hospital";
import { getAssignedUsers } from "@/services/adminService";
import {
  getAppointments,
  reviewAppointment,
  createAppointment,
  finalizeAppointment,
  approveCancellation,
  rejectCancellation,
  closeAppointment,
} from "@/services/appointmentService";
import { getHospitals } from "@/services/hospitalService";

const { Paragraph } = Typography;

const statusColors: Record<string, string> = {
  pending: "blue", pending_confirmation: "orange", user_confirmed: "purple",
  approved: "green", scheduled: "cyan", awaiting_feedback: "orange",
  feedback_provided: "geekblue", completed: "default", cancelled: "red",
  rejected: "red", cancellation_requested: "volcano",
};

const formatStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function StaffPendingRequestsPage() {
  const router = useRouter();
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [pendingAppointments, setPendingAppointments] = useState<Appointment[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
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

  const fetchAllAppointments = async (users: User[]): Promise<Appointment[]> => {
    if (users.length === 0) return [];
    const results = await Promise.all(
      users.map((u) => getAppointments(u._id || u.id).catch(() => [] as Appointment[]))
    );
    return results.flatMap((res) => {
      const list = Array.isArray(res) ? res : (res.data || res.appointments || []);
      return Array.isArray(list) ? list : [];
    });
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setPendingLoading(true);
      try {
        const assignedRes = await getAssignedUsers();
        const list = Array.isArray(assignedRes) ? assignedRes : [];
        if (!cancelled) setAssignedUsers(list);
        if (list.length > 0) {
          const all = await fetchAllAppointments(list);
          if (!cancelled) {
            setPendingAppointments(
              all.filter((a: Appointment) =>
                ["pending", "user_confirmed", "cancellation_requested", "feedback_provided"].includes(a.status)
              )
            );
          }
        }
      } catch {
      } finally {
        if (!cancelled) setPendingLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

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
      const list = assignedUsers;
      if (list.length > 0) {
        const all = await fetchAllAppointments(list);
        setPendingAppointments(
          all.filter((a: Appointment) =>
            ["pending", "user_confirmed", "cancellation_requested", "feedback_provided"].includes(a.status)
          )
        );
      }
    } catch (err) {
      message.error((err as Error)?.message || "Failed to review appointment");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openPropose = (appointment?: Appointment) => {
    const userId = appointment?.user?._id;
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
      await createAppointment({
        userId: proposingForUserId,
        doctorName: values.doctorName as string,
        hospital: values.hospital as string,
        appointmentDate: values.appointmentDate
          ? dayjs(values.appointmentDate as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : "",
        reason: values.reason as string,
        reviewNotes: (values.reviewNotes as string) || undefined,
      });
      message.success(replacing ? "Previous appointment rejected & new proposal sent" : "Appointment proposed");
      setReplacingAppointment(null);
      setProposeModalOpen(false);
      const list = assignedUsers;
      if (list.length > 0) {
        const all = await fetchAllAppointments(list);
        setPendingAppointments(
          all.filter((a: Appointment) =>
            ["pending", "user_confirmed", "cancellation_requested", "feedback_provided"].includes(a.status)
          )
        );
      }
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
      const list = assignedUsers;
      if (list.length > 0) {
        const all = await fetchAllAppointments(list);
        setPendingAppointments(
          all.filter((a: Appointment) =>
            ["pending", "user_confirmed", "cancellation_requested", "feedback_provided"].includes(a.status)
          )
        );
      }
    } catch (err) {
      message.error((err as Error)?.message || "Failed to finalize appointment");
    } finally {
      setFinalizeSubmitting(false);
    }
  };

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
            scroll={{ x: 'max-content' }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            columns={[
              {
                title: "User", key: "user",
                render: (_: unknown, record: Appointment) => <strong>{record.user?.name || "-"}</strong>,
              },
              { title: "Doctor", dataIndex: "doctorName", key: "doctorName" },
              { title: "Hospital", dataIndex: "hospital", key: "hospital", render: (v: string) => v || "-" },
              { title: "Date", dataIndex: "appointmentDate", key: "appointmentDate", render: (d: string) => d ? dayjs(d).format("MMM D, YYYY") : "-" },
              { title: "Reason", dataIndex: "reason", key: "reason", ellipsis: true },
              {
                title: "Status", dataIndex: "status", key: "status",
                render: (s: AppointmentStatus) => <Tag color={statusColors[s] || "default"}>{formatStatus(s)}</Tag>,
              },
              {
                title: "Actions", key: "actions", width: 320,
                render: (_: unknown, record: Appointment) => {
                  const u = assignedUsers.find((x) => (x._id || x.id) === record.user?._id);
                  return (
                    <Space wrap>
                      {record.status === "pending" ? (
                        <>
                          <Button type="primary" size="small" onClick={() => openReview(record, "scheduled")}>Approve</Button>
                          <Button danger size="small" onClick={() => openReview(record, "rejected")}>Reject</Button>
                          <Button size="small" onClick={() => openPropose(record)}>Propose New</Button>
                        </>
                      ) : record.status === "user_confirmed" ? (
                        <Button type="primary" size="small" onClick={() => openFinalize(record)}>Finalize with hospital</Button>
                      ) : record.status === "cancellation_requested" ? (
                        <>
                          <Button type="primary" size="small" onClick={async () => {
                            try { await approveCancellation(record._id); message.success("Cancellation approved"); } catch (err) { message.error((err as Error)?.message || "Failed"); }
                          }}>Approve Cancel</Button>
                          <Button size="small" onClick={async () => {
                            try { await rejectCancellation(record._id); message.success("Cancellation rejected"); } catch (err) { message.error((err as Error)?.message || "Failed"); }
                          }}>Reject Cancel</Button>
                        </>
                      ) : record.status === "feedback_provided" ? (
                        <Button type="primary" size="small" onClick={async () => {
                          try { await closeAppointment(record._id); message.success("Appointment closed"); } catch (err) { message.error((err as Error)?.message || "Failed"); }
                        }}>Close</Button>
                      ) : null}
                      {u && (
                        <Button size="small" icon={<EyeOutlined />} onClick={() => router.push(`/staff/assigned-users`)}>View Profile</Button>
                      )}
                    </Space>
                  );
                },
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
