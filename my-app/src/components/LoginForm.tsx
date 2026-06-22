"use client";

import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
} from "antd";

import {
  MailOutlined,
  LockOutlined,
  LoginOutlined,
} from "@ant-design/icons";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginUser } from "@/services/authService";
import { useAuth } from "@/context/AuthContext";

import { colors, buttonStyles } from "@/styles/theme";

const { Title, Paragraph } = Typography;

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const data = await loginUser(values);

      if (data.user) {
        login(data.token, data.user);

        message.success("Login successful");

        if (data.user.role === "admin") {
          router.push("/admin");
        } else if (data.user.role === "staff") {
          router.push("/staff");
        } else {
          router.push("/user");
        }
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("password") || msg.toLowerCase().includes("email") || msg.toLowerCase().includes("credentials") || msg.toLowerCase().includes("not found")) {
        message.error("Invalid credentials");
      } else {
        message.error(msg || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Card
        style={{
          width: 440,
          borderRadius: "24px",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
        styles={{ body: { padding: "40px 36px" } }}
      >
        {/* Logo / Icon Area */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(74,144,226,0.3)",
            }}
          >
            <LoginOutlined style={{ fontSize: 30, color: colors.white }} />
          </div>

          <Title
            level={2}
            style={{
              color: colors.textPrimary,
              marginBottom: "6px",
              fontSize: "28px",
            }}
          >
            Welcome Back
          </Title>

          <Paragraph
            style={{
              color: colors.textSecondary,
              marginBottom: 0,
              fontSize: "15px",
            }}
          >
            Sign in to your Elder Care account
          </Paragraph>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: colors.textSecondary }} />}
              placeholder="Email address"
              style={{
                borderRadius: "12px",
                height: 48,
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: colors.textSecondary }} />}
              placeholder="Password"
              style={{
                borderRadius: "12px",
                height: 48,
              }}
            />
          </Form.Item>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              htmlType="submit"
              block
              loading={loading}
              size="large"
              icon={<LoginOutlined />}
              style={{
                ...buttonStyles,
                width: "100%",
                height: 52,
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
                color: colors.white,
                border: "none",
                marginTop: "8px",
                fontSize: "17px",
                fontWeight: 600,
                boxShadow: "0 8px 24px rgba(74,144,226,0.35)",
              }}
            >
              Sign In
            </Button>
          </motion.div>
        </Form>

        <div
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: colors.textSecondary,
            fontSize: "14px",
          }}
        >
          Don&apos;t have an account?{" "}
          <span
            onClick={() => router.push("/register")}
            style={{
              color: colors.primary,
              cursor: "pointer",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Create one
          </span>
        </div>
      </Card>
    </motion.div>
  );
}