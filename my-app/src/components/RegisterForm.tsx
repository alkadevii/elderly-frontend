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

import { registerUser } from "@/services/authService";

import {
  colors,
  buttonStyles,
  pageStyles,
} from "@/styles/theme";

const { Title, Paragraph } = Typography;

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

export default function RegisterForm() {
  const router = useRouter();

  const onFinish = async (
    values: RegisterFormValues
  ) => {
    try {
      const data = await registerUser({
        ...values,
        role: "user",
      });

      if (data.user) {
        message.success(
          "Registration successful"
        );

        router.push("/login");
      } else {
        message.error(data.message);
      }
    } catch (error) {
      message.error("Something went wrong");
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
              color: colors.textPrimary,
              marginBottom: "8px",
            }}
          >
            Create Account
          </Title>

          <Paragraph
            style={{
              color: colors.textSecondary,
              marginBottom: 0,
            }}
          >
            Join Elder Care and support
            better living.
          </Paragraph>
        </div>

        <Form
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[
              {
                required: true,
                message:
                  "Please enter your name",
              },
            ]}
          >
            <Input
              size="large"
              placeholder="Enter your name"
              style={{
                borderRadius: "10px",
              }}
            />
          </Form.Item>

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
              Register
            </Button>
          </motion.div>
        </Form>

        <div
          style={{
            textAlign: "center",
            marginTop: "20px",
            color: colors.textSecondary,
          }}
        >
          Already have an account?{" "}
          <span
            onClick={() =>
              router.push("/login")
            }
            style={{
              color: colors.primary,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Login
          </span>
        </div>
      </Card>
    </motion.div>
  );
}