"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Tag,
  Typography,
  Spin,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  HeartOutlined,
  LogoutOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
  LockOutlined,
  DashboardOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/styles/theme";

const { Sider, Content } = Layout;
const { Title } = Typography;

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: colors.background }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!user) return null;

  const isVerified = user.verificationStatus === "verified";
  const hasAssignedStaff = !!user.assignedStaff;
  const isFullyVerified = isVerified && hasAssignedStaff;

  const menuItems = [
    { key: "/user", icon: <HomeOutlined />, label: "Dashboard" },
    {
      key: "/user/appointments",
      icon: isFullyVerified ? <CalendarOutlined /> : <LockOutlined />,
      label: "Appointments",
      disabled: !isFullyVerified,
    },
    {
      key: "/user/emergency-contacts",
      icon: isFullyVerified ? <PhoneOutlined /> : <LockOutlined />,
      label: "Emergency Contacts",
      disabled: !isFullyVerified,
    },
    {
      key: "/user/medical-conditions",
      icon: isFullyVerified ? <HeartOutlined /> : <LockOutlined />,
      label: "Medical Conditions",
      disabled: !isFullyVerified,
    },
    {
      key: "/user/medications",
      icon: isFullyVerified ? <MedicineBoxOutlined /> : <LockOutlined />,
      label: "Medications",
      disabled: !isFullyVerified,
    },
    {
      key: "/user/vitals",
      icon: isFullyVerified ? <DashboardOutlined /> : <LockOutlined />,
      label: "Vitals",
      disabled: !isFullyVerified,
    },
    {
      key: "/user/medication-logs",
      icon: isFullyVerified ? <FileTextOutlined /> : <LockOutlined />,
      label: "Medication Logs",
      disabled: !isFullyVerified,
    },
  ];

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: `linear-gradient(-45deg, ${colors.primary}, ${colors.secondary}, ${colors.background}, ${colors.accent})`,
        backgroundSize: "400% 400%",
        animation: "gradientMove 12s ease infinite",
        padding: 12,
      }}
    >
      <style>{`@keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }`}</style>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center" }}
      >
        <Layout
          style={{
            height: "100%",
            width: "100%",
            maxWidth: 1500,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
          }}
        >
          <Sider
            width={250}
            collapsedWidth={0}
            breakpoint="lg"
            collapsed={collapsed}
            onCollapse={setCollapsed}
            trigger={null}
            theme="light"
            style={{
              background: colors.cardBackground,
              borderRight: "1px solid #e5e7eb",
              height: "100%",
              overflow: "hidden",
            }}
          >
            <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "30px 20px", flexShrink: 0 }}>
                <Title level={4} style={{ color: colors.primary, margin: 0, whiteSpace: "nowrap" }}>Elder Care</Title>
              </div>
              <div style={{ flex: 1, overflow: "auto" }}>
                <Menu
                  mode="inline"
                  selectedKeys={[pathname]}
                  onClick={({ key }) => { router.push(key); setCollapsed(true); }}
                  items={menuItems}
                />
              </div>
              <div style={{ padding: 20, flexShrink: 0 }}>
                <Button danger block icon={<LogoutOutlined />} onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </Sider>

          <Content style={{ padding: 16, background: "transparent", overflow: "auto", height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                  style={{ fontSize: 16, width: 32, height: 32 }}
                />
                <Title level={4} style={{ margin: 0 }}>
                  {pathname === "/user" && (isFullyVerified ? "Dashboard" : "Account Setup")}
                  {pathname === "/user/appointments" && "Appointments"}
                  {pathname === "/user/emergency-contacts" && "Emergency Contacts"}
                  {pathname === "/user/medical-conditions" && "Medical Conditions"}
                  {pathname === "/user/medications" && "Medications"}
                  {pathname === "/user/vitals" && "Vitals"}
                  {pathname === "/user/medication-logs" && "Medication Logs"}
                </Title>
              </div>
              <Avatar size={40} src={user.profileImage} icon={<UserOutlined />} />
            </div>
            {children}
          </Content>
        </Layout>
      </motion.div>
    </div>
  );
}
