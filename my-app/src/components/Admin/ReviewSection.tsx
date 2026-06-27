"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Table,
  Select,
  Rate,
  Tag,
  Typography,
  Space,
  message,
  Row,
  Col,
  Statistic,
  Spin,
  Progress,
} from "antd";
import { StarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { Review, StaffRating } from "@/types/Review";
import { getReviews, getStaffRating } from "@/services/reviewService";
import { getStaff } from "@/services/adminService";

const { Text } = Typography;

export default function ReviewSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [staffList, setStaffList] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [staffFilter, setStaffFilter] = useState<string | undefined>(undefined);

  const [selectedStaffRating, setSelectedStaffRating] = useState<StaffRating | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const query: Record<string, unknown> = { page, limit: 50 };
      if (staffFilter) query.staffId = staffFilter;
      const res = await getReviews(query);
      const data = Array.isArray(res) ? { reviews: res, pagination: { total: res.length } } : res;
      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setTotal(data.pagination?.total || 0);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page, staffFilter]);

  const fetchStaffList = useCallback(async () => {
    try {
      const res = await getStaff();
      setStaffList(Array.isArray(res) ? res : []);
    } catch {
      setStaffList([]);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  const fetchStaffRating = useCallback(async (staffId: string) => {
    setRatingLoading(true);
    setSelectedStaffRating(null);
    try {
      const res = await getStaffRating(staffId);
      setSelectedStaffRating(res.data || res);
    } catch {
      message.error("Failed to load staff rating");
    } finally {
      setRatingLoading(false);
    }
  }, []);

  const handleRowClick = (record: Review) => {
    const staffId = record.staff?._id;
    if (staffId) fetchStaffRating(staffId);
  };

  const columns = [
    {
      title: "Staff",
      key: "staff",
      width: 180,
      render: (_: unknown, record: Review) => (
        <Text strong>{record.staff?.name || "-"}</Text>
      ),
    },
    {
      title: "User",
      key: "user",
      width: 180,
      render: (_: unknown, record: Review) => (
        <Text>{record.user?.name || "-"}</Text>
      ),
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      width: 140,
      render: (r: number) => (
        <Space>
          <Rate disabled value={r} allowHalf style={{ fontSize: 14 }} />
          <Text type="secondary">{r}</Text>
        </Space>
      ),
    },
    {
      title: "Comments",
      dataIndex: "comments",
      key: "comments",
      ellipsis: true,
      render: (c: string) => c || "-",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (d: string) => (
        <Text style={{ fontSize: 13 }}>{d ? dayjs(d).format("MMM D, YYYY") : "-"}</Text>
      ),
    },
  ];

  const renderRatingDistribution = () => {
    if (!selectedStaffRating) return null;
    const b = selectedStaffRating.breakdown;
    const stars = [5, 4, 3, 2, 1];
    const maxCount = Math.max(...stars.map((s) => b?.[(`${s}star`) as keyof typeof b] || 0), 1);
    return (
      <div style={{ marginTop: 16 }}>
        <Text strong style={{ display: "block", marginBottom: 8 }}>Rating Distribution</Text>
        {stars.map((star) => {
          const count = b?.[(`${star}star`) as keyof typeof b] || 0;
          return (
            <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Space style={{ width: 60 }}>
                <StarOutlined style={{ color: "#faad14", fontSize: 13 }} />
                <Text style={{ fontSize: 13 }}>{star}</Text>
              </Space>
              <Progress
                percent={Math.round((count / maxCount) * 100)}
                showInfo={false}
                size="small"
                style={{ flex: 1, margin: 0 }}
                strokeColor="#faad14"
              />
              <Text style={{ width: 40, textAlign: "right", fontSize: 13 }}>{count}</Text>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <Space wrap>
            <Select
              value={staffFilter}
              onChange={(v) => { setStaffFilter(v || undefined); setPage(1); }}
              style={{ width: 200 }}
              placeholder="Filter by Staff"
              allowClear
              onSelect={(v: string) => fetchStaffRating(v)}
            >
              {staffList.map((s) => (
                <Select.Option key={s._id} value={s._id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Space>
        </div>

        <Table
          dataSource={reviews}
          columns={columns}
          rowKey="_id"
          loading={loading}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: selectedStaffRating?.staffId === record.staff?._id ? "pointer" : undefined },
          })}
          pagination={{
            current: page,
            pageSize: 50,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showTotal: (t) => `${t} reviews`,
          }}
        />
      </Card>

      {selectedStaffRating && (
        <Card
          style={{ borderRadius: 16, marginTop: 20 }}
          title={
            <Space>
              <StarOutlined style={{ color: "#faad14" }} />
              <span>Rating Summary - {selectedStaffRating.staffName}</span>
            </Space>
          }
        >
          <Spin spinning={ratingLoading}>
            <Row gutter={[20, 20]}>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 12, textAlign: "center", background: "#fafafa" }} size="small">
                  <Statistic
                    title="Average Rating"
                    value={selectedStaffRating.averageRating}
                    precision={1}
                    prefix={<StarOutlined style={{ color: "#faad14" }} />}
                    suffix={
                      <div style={{ marginTop: 4 }}>
                        <Rate
                          disabled
                          value={Math.round(selectedStaffRating.averageRating)}
                          allowHalf
                          style={{ fontSize: 14 }}
                        />
                      </div>
                    }
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 12, textAlign: "center", background: "#fafafa" }} size="small">
                  <Statistic
                    title="Total Reviews"
                    value={selectedStaffRating.totalReviews}
                    prefix={<StarOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card style={{ borderRadius: 12, background: "#fafafa" }} size="small">
                  {renderRatingDistribution()}
                </Card>
              </Col>
            </Row>

            {selectedStaffRating.reviews && selectedStaffRating.reviews.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <Text strong style={{ display: "block", marginBottom: 12 }}>Recent Reviews</Text>
                {selectedStaffRating.reviews.slice(0, 5).map((r) => (
                  <Card
                    key={r._id}
                    size="small"
                    style={{ borderRadius: 12, marginBottom: 8 }}
                    styles={{ body: { padding: "12px 16px" } }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <Space>
                        <Text strong>{r.user?.name || "Unknown"}</Text>
                        <Rate disabled value={r.rating} allowHalf style={{ fontSize: 12 }} />
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(r.createdAt).format("MMM D, YYYY")}
                      </Text>
                    </div>
                    {r.comments && (
                      <Text style={{ display: "block", marginTop: 4, fontSize: 13 }}>{r.comments}</Text>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </Spin>
        </Card>
      )}
    </div>
  );
}
