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
  UserOutlined,
  MailOutlined,
  LockOutlined,
  UserAddOutlined,
} from "@ant-design/icons";

import { motion } from "framer-motion";

import { useRouter } from "next/navigation";

import { registerUser } from "@/services/authService";

import { colors, buttonStyles } from "@/styles/theme";

const { Title, Paragraph } = Typography;

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterForm() {
  const router = useRouter();

  const onFinish = async (values: RegisterFormValues) => {
    try {
      const data = await registerUser({
        ...values,
        role: "user",
      });

      if (data.user) {
        message.success("Registration successful");
        router.push("/login");
      } else {
        message.error(data.message);
      }
    } catch {
      message.error("Something went wrong");
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
              background: `linear-gradient(135deg, ${colors.secondary}, ${colors.primary})`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              boxShadow: "0 8px 24px rgba(127,183,126,0.3)",
            }}
          >
            <UserAddOutlined style={{ fontSize: 30, color: colors.white }} />
          </div>

          <Title
            level={2}
            style={{
              color: colors.textPrimary,
              marginBottom: "6px",
              fontSize: "28px",
            }}
          >
            Create Account
          </Title>

          <Paragraph
            style={{
              color: colors.textSecondary,
              marginBottom: 0,
              fontSize: "15px",
            }}
          >
            Join Elder Care and support better living
          </Paragraph>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: colors.textSecondary }} />}
              placeholder="Full name"
              style={{
                borderRadius: "12px",
                height: 48,
              }}
            />
          </Form.Item>

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
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
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
              size="large"
              icon={<UserAddOutlined />}
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
              Create Account
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
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            style={{
              color: colors.primary,
              cursor: "pointer",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Sign in
          </span>
        </div>
      </Card>
    </motion.div>
  );
}