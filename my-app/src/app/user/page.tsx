"use client";

import { useEffect, useState } from "react";

import {
  Typography,
  Card,
  Button,
  Spin,
} from "antd";

import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/services/authService";

const { Title, Paragraph } = Typography;

type User = {
  id: string;
  name: string;
  email: string;
  profileCompleted?: boolean;
};

export default function UserPage() {
  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data =
          await getCurrentUser();

        if (!data.user) {
          router.push("/login");
          return;
        }

        setUser(data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!user.profileCompleted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px",
        }}
      >
        <Card
          style={{
            width: 500,
            textAlign: "center",
            borderRadius: "16px",
          }}
        >
          <Title level={2}>
            Welcome, {user.name} 👋
          </Title>

          <Paragraph>
            <strong>Email:</strong>{" "}
            {user.email}
          </Paragraph>

          <Paragraph>
            Your profile is not complete
            yet. Please complete your
            profile to continue.
          </Paragraph>

          <Button
            type="primary"
            size="large"
            onClick={() =>
              router.push(
                "/complete-profile"
              )
            }
          >
            Complete Profile
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <Title level={2}>
        Welcome, {user.name} 👋
      </Title>

      <Paragraph>
        Your profile is complete.
      </Paragraph>
    </div>
  );
}