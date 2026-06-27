"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Rate,
  Input,
  Typography,
  Space,
  message,
} from "antd";
import { StarOutlined, SmileOutlined } from "@ant-design/icons";
import type { Review } from "@/types/Review";
import { createReview, getReviews } from "@/services/reviewService";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/styles/theme";

const { Text, Title, Paragraph } = Typography;

export default function UserFeedbackSection() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [form] = Form.useForm();

  const assignedStaff = user?.assignedStaff as { _id: string; name: string } | undefined;

  useEffect(() => {
    if (!user?._id) return;
    getReviews({ userId: user._id }).then((res) => {
      const data = Array.isArray(res) ? res : res.reviews || [];
      setMyReviews(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, [user?._id]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!assignedStaff) {
      message.warning("No staff member assigned to you.");
      return;
    }
    setSubmitting(true);
    try {
      await createReview({
        staff: assignedStaff._id,
        user: user!._id,
        rating: values.rating as number,
        comments: values.comments as string | undefined,
      });
      message.success("Feedback submitted! Thank you.");
      setModalOpen(false);
      form.resetFields();
      const res = await getReviews({ userId: user!._id });
      const data = Array.isArray(res) ? res : res.reviews || [];
      setMyReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      message.error((err as Error)?.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (!assignedStaff) return null;

  const latestReview = myReviews.length > 0 ? myReviews[myReviews.length - 1] : null;

  return (
    <div>
      <Card style={{ borderRadius: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Space>
            <SmileOutlined style={{ fontSize: 20, color: colors.primary }} />
            <div>
              <Title level={5} style={{ margin: 0 }}>Your Care Staff</Title>
              <Text style={{ color: colors.textSecondary }}>{assignedStaff.name}</Text>
            </div>
          </Space>
          <Button icon={<StarOutlined />} onClick={() => setModalOpen(true)}>
            {latestReview ? "Submit New Feedback" : "Submit Feedback"}
          </Button>
        </div>

        {latestReview && (
          <div style={{ marginTop: 16, padding: 12, background: "#f8fafc", borderRadius: 12 }}>
            <Text strong style={{ display: "block", marginBottom: 8 }}>Your Latest Feedback</Text>
            <Space>
              <Rate disabled value={latestReview.rating} style={{ fontSize: 14 }} />
              <Text>({latestReview.rating}/5)</Text>
            </Space>
            {latestReview.comments && (
              <Paragraph style={{ margin: "8px 0 0", fontSize: 13, color: colors.textSecondary }}>
                "{latestReview.comments}"
              </Paragraph>
            )}
          </div>
        )}
      </Card>

      <Modal
        title={`Rate ${assignedStaff.name}`}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <div style={{ textAlign: "center", margin: "20px 0" }}>
          <Title level={4}>How would you rate your staff member?</Title>
          <Text type="secondary">Staff: {assignedStaff.name}</Text>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: "Please provide a rating" }]}
            style={{ textAlign: "center" }}
          >
            <Rate allowHalf style={{ fontSize: 28 }} />
          </Form.Item>

          <Form.Item name="comments" label="Comments (optional)">
            <Input.TextArea rows={3} placeholder="Share your experience..." />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => { setModalOpen(false); form.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<StarOutlined />}>
              Submit Rating
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
