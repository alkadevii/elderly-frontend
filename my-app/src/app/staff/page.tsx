"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/context/AuthContext";
import StaffDashboard from "@/components/Staff/StaffDashboard";
import { colors } from "@/styles/theme";

export default function StaffPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "staff")) {
      router.push("/login");
    }
  }, [loading, user, role, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: colors.background }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user || role !== "staff") return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(-45deg, ${colors.secondary}, ${colors.primary}, ${colors.background}, ${colors.accent})`,
        backgroundSize: "400% 400%",
        animation: "gradientMove 12s ease infinite",
        padding: "20px",
      }}
    >
      <StaffDashboard />
    </div>
  );
}
