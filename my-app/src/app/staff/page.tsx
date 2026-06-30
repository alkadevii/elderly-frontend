"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Typography,
  Spin,
  Space,
  Rate,
  Progress,
  Avatar,
} from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  TeamOutlined,
  StarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { colors } from "@/styles/theme";
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/User";
import type { StaffDashboardData } from "@/types/StaffDashboard";
import type { StaffRating } from "@/types/Review";
import { getAssignedUsers, getStaffDashboard } from "@/services/adminService";
import { getStaffRating } from "@/services/reviewService";

const { Title, Paragraph } = Typography;

export default function StaffDashboardPage() {
  const { user } = useAuth();
  const [assignedUsers, setAssignedUsers] = useState<User[]>([]);
  const [dashboardData, setDashboardData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [myRating, setMyRating] = useState<StaffRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

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
          setDashboardData(dashboardRes.data || dashboardRes);
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

  if (loading || !user) {
    return <div style={{ textAlign: "center", padding: 60 }}><Spin size="large" /></div>;
  }

  return (
    <div>
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
}
