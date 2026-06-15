"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Divider,
} from "antd";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  colors,
  buttonStyles,
  pageStyles,
} from "@/styles/theme";
import {
  updateProfile,
  getCurrentUser,
  UpdateProfileData,
} from "@/services/authService";

const { Title, Paragraph } = Typography;

export default function CompleteProfilePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getCurrentUser();

        if (!data.user) {
          router.push("/login");
          return;
        }

        const user = data.user;

        if (form) {
          form.setFieldsValue({
            age: user.age || "",
            phone: user.phone || "",
            address: user.address || "",
            emergencyContact: user.emergencyContact || "",
            medicalConditions: user.medicalConditions || "",
          });
        }
      } catch (error) {
        console.error(error);
        message.error("Failed to load profile");
      } finally {
        setPageLoading(false);
      }
    };

    fetchUser();
  }, [form, router]);

  const onFinish = async (values: UpdateProfileData) => {
    try {
      setLoading(true);

      const response = await updateProfile(values);

      if (response.user) {
        message.success("Profile updated successfully");
        router.push("/user");
      } else {
        message.error(
          response.message || "Failed to update profile"
        );
      }
    } catch (error) {
      console.error(error);
      message.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>

      <div
        style={{
          ...pageStyles.heroContainer,
          backgroundImage: `
            linear-gradient(
              -45deg,
              ${colors.primary},
              ${colors.secondary},
              ${colors.background},
              ${colors.accent}
            )
          `,
          backgroundSize: "400% 400%",
          animation: "gradientMove 12s ease infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(3px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: "relative", zIndex: 1, padding: "20px 0" }}
        >
          <Card
            style={{
              ...pageStyles.card,
              width: 750,
              maxWidth: "95vw",
            }}
          >
            <Spin spinning={pageLoading} size="large" description="Loading profile...">
            <Title
              level={2}
              style={{
                color: colors.textPrimary,
                textAlign: "center",
                marginBottom: 4,
              }}
            >
              Edit Profile
            </Title>

            <Paragraph
              style={{
                textAlign: "center",
                color: colors.textSecondary,
                marginBottom: 24,
              }}
            >
              Update your personal, emergency, and medical information
            </Paragraph>

            <Form form={form} layout="vertical" onFinish={onFinish}>
              <Title level={5} style={{ color: colors.primary, marginBottom: 16 }}>
                Personal Information
              </Title>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Age" name="age">
                    <Input size="large" placeholder="Enter your age" type="number" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Phone Number" name="phone">
                    <Input size="large" placeholder="Enter phone number" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Address" name="address">
                <Input size="large" placeholder="Enter your full address" />
              </Form.Item>

              <Divider style={{ margin: "8px 0 20px" }} />

              <Title level={5} style={{ color: colors.primary, marginBottom: 16 }}>
                Emergency & Medical
              </Title>

              <Form.Item label="Emergency Contact" name="emergencyContact">
                <Input size="large" placeholder="Emergency contact name and number" />
              </Form.Item>

              <Form.Item label="Medical Conditions" name="medicalConditions">
                <Input.TextArea
                  rows={4}
                  placeholder="List any medical conditions, allergies, or special notes"
                />
              </Form.Item>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ marginTop: 8 }}
              >
                <Button
                  htmlType="submit"
                  block
                  loading={loading}
                  size="large"
                  style={{
                    ...buttonStyles,
                    background: colors.primary,
                    color: colors.white,
                    border: "none",
                    boxShadow: "0 8px 20px rgba(74,144,226,0.3)",
                  }}
                >
                  Update Profile
                </Button>
              </motion.div>
            </Form>
            </Spin>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
