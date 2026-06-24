"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Divider,
  Avatar,
} from "antd";
import PhoneInput from "@/components/common/PhoneInput";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { colors, buttonStyles, pageStyles } from "@/styles/theme";
import { updateProfile, getCurrentUser, UpdateProfileData } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

const { Title, Paragraph } = Typography;

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 300;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas not supported")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    compressImage(file)
      .then((dataUrl) => {
        setPreviewImage(dataUrl);
        form.setFieldsValue({ profileImage: dataUrl });
      })
      .catch(() => {
        message.error("Failed to process image");
      });
  };

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
          setPreviewImage(user.profileImage || null);
          form.setFieldsValue({
            profileImage: user.profileImage || "",
            dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : undefined,
            gender: user.gender || undefined,
            bloodGroup: user.bloodGroup || undefined,
            phone: user.phone || "",
            address: user.address || "",
            identificationMark: user.identificationMark || "",
            emergencyNotes: user.emergencyNotes || "",
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

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      setLoading(true);

      const payload: UpdateProfileData = {
        profileImage: values.profileImage as string || undefined,
        dateOfBirth: values.dateOfBirth
          ? dayjs(values.dateOfBirth as Parameters<typeof dayjs>[0]).format("YYYY-MM-DD")
          : undefined,
        gender: values.gender as "male" | "female" | "other" | undefined,
        bloodGroup: values.bloodGroup as UpdateProfileData["bloodGroup"] | undefined,
        phone: values.phone as string,
        address: values.address as string,
        identificationMark: values.identificationMark as string,
        emergencyNotes: values.emergencyNotes as string,
      };

      const response = await updateProfile(payload);

      if (response.user) {
        const token = localStorage.getItem("token") || "";
        login(token, response.user);
        message.success("Profile updated successfully. Your profile has been submitted for verification.");
        router.push("/user");
      } else {
        message.error(response.message || "Failed to update profile");
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
              {/* Profile Image */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Avatar
                  size={100}
                  src={previewImage}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 12, border: `3px solid ${colors.primary}` }}
                />
                <div>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      padding: "8px 20px",
                      borderRadius: "10px",
                      background: colors.cardBackground,
                      border: `1px solid ${colors.primary}`,
                      color: colors.primary,
                      fontWeight: 500,
                      fontSize: "14px",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = colors.primary;
                      e.currentTarget.style.color = colors.white;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = colors.cardBackground;
                      e.currentTarget.style.color = colors.primary;
                    }}
                  >
                    <UploadOutlined /> Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                    />
                  </label>
                  {previewImage && (
                    <Button
                      type="link"
                      danger
                      size="small"
                      style={{ marginLeft: 8 }}
                      onClick={() => {
                        setPreviewImage(null);
                        form.setFieldsValue({ profileImage: "" });
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>

              <Form.Item name="profileImage" hidden>
                <Input />
              </Form.Item>

              <Title level={5} style={{ color: colors.primary, marginBottom: 16 }}>
                Personal Information
              </Title>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Date of Birth" name="dateOfBirth">
                    <DatePicker style={{ width: "100%" }} size="large" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Gender" name="gender">
                    <Select size="large" placeholder="Select gender">
                      <Select.Option value="male">Male</Select.Option>
                      <Select.Option value="female">Female</Select.Option>
                      <Select.Option value="other">Other</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Blood Group" name="bloodGroup">
                    <Select size="large" placeholder="Select blood group">
                      {bloodGroups.map((bg) => (
                        <Select.Option key={bg} value={bg}>{bg}</Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Phone Number" name="phone">
                    <PhoneInput />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="Address" name="address">
                <Input size="large" placeholder="Enter your full address" />
              </Form.Item>

              <Form.Item label="Identification Mark" name="identificationMark">
                <Input size="large" placeholder="Any distinguishing marks" />
              </Form.Item>

              <Divider style={{ margin: "8px 0 20px" }} />

              <Title level={5} style={{ color: colors.primary, marginBottom: 16 }}>
                Emergency Notes
              </Title>

              <Form.Item label="Emergency Notes" name="emergencyNotes">
                <Input.TextArea
                  rows={4}
                  placeholder="Any emergency-related notes, allergies, or special instructions"
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
