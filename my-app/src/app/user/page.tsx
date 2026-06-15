"use client";

import { useEffect, useState } from "react";

import { Spin } from "antd";

import { useRouter } from "next/navigation";

import { getCurrentUser } from "@/services/authService";

import UserDashboard from "@/components/Dashboard/UserDashboard";

import type { User } from "@/types/User";

import { colors } from "@/styles/theme";

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
      } catch (error) {
        console.error(error);
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
          background:
            colors.background,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UserDashboard
      user={user}
      profileCompleted={
        user.profileCompleted
      }
      onCompleteProfile={() =>
        router.push(
          "/complete-profile"
        )
      }
      onLogout={() => {
        localStorage.removeItem(
          "token"
        );

        router.push("/login");
      }}
    />
  );
}