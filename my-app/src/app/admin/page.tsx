"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spin } from "antd";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { colors } from "@/styles/theme";

export default function AdminPage() {
  const { user, role, loading, refreshUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
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

  if (!user || role !== "admin") return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: `linear-gradient(-45deg, ${colors.primary}, ${colors.secondary}, ${colors.background}, ${colors.accent})`,
        backgroundSize: "400% 400%",
        padding: "20px",
      }}
    >
      <style>
        {`@keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}
      </style>
      <AdminDashboard />
    </div>
  );
}
