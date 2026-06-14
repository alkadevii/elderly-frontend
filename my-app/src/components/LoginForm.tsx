"use client";

import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  message,
} from "antd";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { loginUser } from "@/services/authService";

import {
  colors,
  buttonStyles,
} from "@/styles/theme";

const { Title, Paragraph } = Typography;

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginForm() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const onFinish = async (
    values: LoginFormValues
  ) => {
    setLoading(true);

    try {
      const data = await loginUser(values);

      if (data.user) {
        // Save JWT Token
        localStorage.setItem(
          "token",
          data.token
        );

        // Save User Info
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        message.success(
          "Login successful"
        );

        if (data.user.role === "admin") {
          router.push("/admin");
        } else {
          router.push("/user");
        }
      } else {
        message.error(data.message);
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

  return (
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
    >
      <Card
        style={{
          width: 420,
          borderRadius: "24px",
          background:
            "rgba(255,255,255,0.82)",
          backdropFilter: "blur(10px)",
          border: "none",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.12)",
          padding: "10px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          <Title
            level={2}
            style={{
              color:
                colors.textPrimary,
              marginBottom: "8px",
            }}
          >
            Welcome Back
          </Title>

          <Paragraph
            style={{
              color:
                colors.textSecondary,
              marginBottom: 0,
            }}
          >
            Login to continue using
            Elder Care.
          </Paragraph>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message:
                  "Please enter your email",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Enter your email"
              style={{
                borderRadius: "10px",
              }}
            />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              {
                required: true,
                message:
                  "Please enter your password",
              },
            ]}
          >
            <Input.Password
              size="large"
              placeholder="Enter your password"
              style={{
                borderRadius: "10px",
              }}
            />
          </Form.Item>

          <motion.div
            whileHover={{
              scale: 1.03,
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
                width: "100%",
                background:
                  colors.primary,
                color: colors.white,
                border: "none",
                marginTop: "10px",
                boxShadow:
                  "0 8px 20px rgba(74,144,226,0.3)",
              }}
            >
              Login
            </Button>
          </motion.div>
        </Form>

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            color:
              colors.textSecondary,
          }}
        >
          Don&apos;t have an account?{" "}
          <span
            onClick={() =>
              router.push(
                "/register"
              )
            }
            style={{
              color: colors.primary,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Register
          </span>
        </div>
      </Card>
    </motion.div>
  );
}