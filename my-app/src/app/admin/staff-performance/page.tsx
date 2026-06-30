"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Spin,
  Space,
  Rate,
  Progress,
  Typography,
} from "antd";
import {
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { colors } from "@/styles/theme";
import dayjs from "dayjs";
import type { StaffPerformanceData, StaffPerformanceItem } from "@/types/StaffPerformance";
import type { StaffRating } from "@/types/Review";
import { getStaffPerformance } from "@/services/adminService";
import { getStaffRating } from "@/services/reviewService";

const { Text } = Typography;

export default function AdminStaffPerformancePage() {
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformanceData | null>(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [selectedStaffRating, setSelectedStaffRating] = useState<StaffRating | null>(null);
  const [staffRatingLoading, setStaffRatingLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setPerfLoading(true);
      try {
        const res = await getStaffPerformance();
        if (!cancelled) setStaffPerformance(res.data || res);
      } catch {
      } finally {
        if (!cancelled) setPerfLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return !staffPerformance ? (
    <div style={{ textAlign: "center", padding: 60 }}>
      <Spin size="large" />
    </div>
  ) : (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic title="Total Staff" value={staffPerformance.summary.totalStaff} prefix={<TeamOutlined />} styles={{ content: { color: colors.primary } }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic title="Total Appointments" value={staffPerformance.summary.totalAppointments} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Statistic
              title="Overall Resolution Rate"
              value={staffPerformance.summary.overallResolutionRate}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              styles={{ content: { color: staffPerformance.summary.overallResolutionRate >= 80 ? "#10b981" : "#ef4444" } }}
            />
          </Card>
        </Col>
      </Row>
      <Card style={{ borderRadius: 16 }}>
        <Table
          dataSource={staffPerformance.staffPerformance}
          rowKey={(r) => r.staff._id}
          loading={perfLoading}
          scroll={{ x: 'max-content' }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          onRow={(record) => ({
            onClick: () => {
              setStaffRatingLoading(true);
              setSelectedStaffRating(null);
              getStaffRating(record.staff._id).then((res) => {
                setSelectedStaffRating(res.data || res);
              }).catch(() => {}).finally(() => setStaffRatingLoading(false));
            },
            style: { cursor: "pointer" },
          })}
          columns={[
            { title: "Name", key: "name", render: (_: unknown, r: StaffPerformanceItem) => <strong>{r.staff.name}</strong> },
            { title: "Email", key: "email", render: (_: unknown, r: StaffPerformanceItem) => r.staff.email },
            { title: "Users", key: "users", render: (_: unknown, r: StaffPerformanceItem) => r.assignedUsers, sorter: (a: StaffPerformanceItem, b: StaffPerformanceItem) => a.assignedUsers - b.assignedUsers },
            { title: "Total", key: "total", render: (_: unknown, r: StaffPerformanceItem) => r.appointments.total, sorter: (a: StaffPerformanceItem, b: StaffPerformanceItem) => a.appointments.total - b.appointments.total },
            { title: "Completed", key: "completed", render: (_: unknown, r: StaffPerformanceItem) => <Tag color="green">{r.appointments.completed}</Tag>, sorter: (a: StaffPerformanceItem, b: StaffPerformanceItem) => a.appointments.completed - b.appointments.completed },
            { title: "Cancelled", key: "cancelled", render: (_: unknown, r: StaffPerformanceItem) => <Tag color="red">{r.appointments.cancelled}</Tag>, sorter: (a: StaffPerformanceItem, b: StaffPerformanceItem) => a.appointments.cancelled - b.appointments.cancelled },
            { title: "Rejected", key: "rejected", render: (_: unknown, r: StaffPerformanceItem) => <Tag color="orange">{r.appointments.rejected}</Tag>, sorter: (a: StaffPerformanceItem, b: StaffPerformanceItem) => a.appointments.rejected - b.appointments.rejected },
            {
              title: "Resolution Rate",
              key: "resolutionRate",
              render: (_: unknown, r: StaffPerformanceItem) => {
                const rate = r.appointments.resolutionRate;
                return <Tag color={rate >= 80 ? "green" : rate >= 60 ? "orange" : "red"}>{rate}%</Tag>;
              },
              sorter: (a: StaffPerformanceItem, b: StaffPerformanceItem) => a.appointments.resolutionRate - b.appointments.resolutionRate,
            },
            {
              title: "Rating",
              key: "rating",
              render: (_: unknown, r: StaffPerformanceItem) => {
                const sr = selectedStaffRating;
                if (sr?.staffId === r.staff._id && sr.averageRating) {
                  return (
                    <Space>
                      <Rate disabled value={Math.round(sr.averageRating)} style={{ fontSize: 12 }} />
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>{sr.averageRating.toFixed(1)}</span>
                    </Space>
                  );
                }
                return <Tag icon={<StarOutlined />} color="default" style={{ fontSize: 11 }}>Click to load</Tag>;
              },
            },
          ]}
        />
      </Card>

      {selectedStaffRating && (
        <Card
          style={{ borderRadius: 16, marginTop: 20 }}
          title={<Space><StarOutlined style={{ color: "#faad14" }} />Rating Detail — {selectedStaffRating.staffName || selectedStaffRating.staffId}</Space>}
        >
          <Spin spinning={staffRatingLoading}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <Card style={{ borderRadius: 12, textAlign: "center", background: "#fafafa" }} size="small">
                  <Statistic title="Average" value={selectedStaffRating.averageRating} precision={1} prefix={<StarOutlined style={{ color: "#faad14" }} />} />
                  <div style={{ marginTop: 4 }}><Rate disabled value={Math.round(selectedStaffRating.averageRating)} style={{ fontSize: 12 }} /></div>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card style={{ borderRadius: 12, textAlign: "center", background: "#fafafa" }} size="small">
                  <Statistic title="Total Reviews" value={selectedStaffRating.totalReviews} prefix={<StarOutlined />} />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card style={{ borderRadius: 12, background: "#fafafa" }} size="small">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const key = `${star}star` as keyof typeof selectedStaffRating.breakdown;
                    const count = selectedStaffRating.breakdown?.[key] || 0;
                    const pct = selectedStaffRating.totalReviews > 0 ? Math.round((count / selectedStaffRating.totalReviews) * 100) : 0;
                    return (
                      <div key={star} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, width: 30 }}>{star}★</span>
                        <Progress percent={pct} showInfo={false} size="small" strokeColor="#faad14" style={{ flex: 1, margin: 0 }} />
                        <span style={{ fontSize: 11, width: 20, textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </Card>
              </Col>
            </Row>
            {selectedStaffRating.reviews && selectedStaffRating.reviews.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {selectedStaffRating.reviews.slice(0, 5).map((r) => (
                  <div key={r._id} style={{ padding: "8px 0", borderTop: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Space>
                        <strong>{r.user?.name || "Unknown"}</strong>
                        <Rate disabled value={r.rating} style={{ fontSize: 11 }} />
                      </Space>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>{dayjs(r.createdAt).format("MMM D, YYYY")}</span>
                    </div>
                    {r.comments && <div style={{ fontSize: 12, marginTop: 2, color: colors.textSecondary }}>"{r.comments}"</div>}
                  </div>
                ))}
              </div>
            )}
          </Spin>
        </Card>
      )}
    </div>
  );
}
