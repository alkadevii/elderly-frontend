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

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] =
    useState(true);

  const [userId, setUserId] =
    useState("");

  const [initialValues, setInitialValues] =
    useState({
      age: "",
      phone: "",
      address: "",
      emergencyContact: "",
      medicalConditions: "",
    });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data =
          await getCurrentUser();

        if (!data.user) {
          router.push("/login");
          return;
        }

        const user = data.user;

        setUserId(user.id);

        setInitialValues({
          age: user.age || "",
          phone: user.phone || "",
          address: user.address || "",
          emergencyContact:
            user.emergencyContact || "",
          medicalConditions:
            user.medicalConditions || "",
        });
      } catch (error) {
        console.error(error);

        message.error(
          "Failed to load profile"
        );
      } finally {
        setPageLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const onFinish = async (
    values: UpdateProfileData
  ) => {
    try {
      setLoading(true);

      const response =
        await updateProfile(
          userId,
          values
        );

      if (response.user) {
        message.success(
          "Profile updated successfully"
        );

        router.push("/user");
      } else {
        message.error(
          response.message ||
            "Failed to update profile"
        );
      }
    } catch (error) {
      console.error(error);

      message.error(
        "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent:
            "center",
          alignItems: "center",
          background:
            colors.background,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

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
          animation:
            "gradientMove 12s ease infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "rgba(255,255,255,0.15)",
            backdropFilter:
              "blur(3px)",
          }}
        />

        <motion.div
          initial={{
            opacity: 0,
            y: 30,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.8,
          }}
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <Card
            style={{
              ...pageStyles.card,
              width: 650,
            }}
          >
            <Title
              level={2}
              style={{
                color:
                  colors.textPrimary,
                textAlign: "center",
              }}
            >
              Edit Profile
            </Title>

            <Paragraph
              style={{
                textAlign: "center",
                color:
                  colors.textSecondary,
                marginBottom: 30,
              }}
            >
              Update your personal,
              emergency and medical
              information anytime.
            </Paragraph>

            <Form
              layout="vertical"
              initialValues={
                initialValues
              }
              onFinish={onFinish}
            >
              <Form.Item
                label="Age"
                name="age"
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label="Phone Number"
                name="phone"
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label="Address"
                name="address"
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label="Emergency Contact"
                name="emergencyContact"
              >
                <Input size="large" />
              </Form.Item>

              <Form.Item
                label="Medical Conditions"
                name="medicalConditions"
              >
                <Input.TextArea
                  rows={4}
                />
              </Form.Item>

              <motion.div
                whileHover={{
                  scale: 1.02,
                }}
                whileTap={{
                  scale: 0.98,
                }}
              >
                <Button
                  htmlType="submit"
                  block
                  loading={loading}
                  size="large"
                  style={{
                    ...buttonStyles,
                    background:
                      colors.primary,
                    color:
                      colors.white,
                    border: "none",
                  }}
                >
                  Update Profile
                </Button>
              </motion.div>
            </Form>
          </Card>
        </motion.div>
      </div>
    </>
  );
}