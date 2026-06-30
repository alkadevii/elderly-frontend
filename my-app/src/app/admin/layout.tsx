"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Layout, Menu, Button, Avatar, Tag, Typography, Spin } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  LogoutOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BankOutlined,
  UserAddOutlined,
  UserSwitchOutlined,
  FileTextOutlined,
  BarChartOutlined,
  StarOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/styles/theme";

const { Sider, Content } = Layout;
const { Title } = Typography;

const menuItems = [
  { key: "/admin", icon: <HomeOutlined />, label: "Dashboard" },
  { key: "/admin/users", icon: <TeamOutlined />, label: "Users" },
  { key: "/admin/pending-profiles", icon: <ClockCircleOutlined />, label: "Pending Profiles" },
  { key: "/admin/unassigned-users", icon: <UserSwitchOutlined />, label: "Unassigned Users" },
  { key: "/admin/hospitals", icon: <BankOutlined />, label: "Hospitals" },
  { key: "/admin/staff", icon: <UserAddOutlined />, label: "Staff" },
  { key: "/admin/audit-log", icon: <FileTextOutlined />, label: "Audit Log" },
  { key: "/admin/staff-performance", icon: <BarChartOutlined />, label: "Staff Performance" },
  { key: "/admin/reviews", icon: <StarOutlined />, label: "Reviews" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role, loading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.push("/login");
    }
  }, [loading, user, role, router]);

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

  if (!user || role !== "admin") return null;

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        justifyContent: "center",
        background: `linear-gradient(-45deg, ${colors.primary}, ${colors.secondary}, ${colors.background}, ${colors.accent})`,
        backgroundSize: "400% 400%",
        padding: 12,
      }}
    >
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
                <Title level={4} style={{ color: colors.primary, margin: 0, whiteSpace: "nowrap" }}>Elder Care Admin</Title>
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
                  {pathname === "/admin" && "Dashboard"}
                  {pathname === "/admin/users" && "Users"}
                  {pathname === "/admin/hospitals" && "Hospitals"}
                  {pathname === "/admin/staff" && "Staff Management"}
                  {pathname === "/admin/pending-profiles" && "Pending Profiles"}
                  {pathname === "/admin/unassigned-users" && "Unassigned Users"}
                  {pathname === "/admin/audit-log" && "Audit Log"}
                  {pathname === "/admin/staff-performance" && "Staff Performance"}
                  {pathname === "/admin/reviews" && "Reviews"}
                </Title>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Tag color="red">Admin</Tag>
                <Avatar size={40} src={user.profileImage} icon={<UserOutlined />} />
              </div>
            </div>
            {children}
          </Content>
        </Layout>
      </motion.div>
    </div>
  );
}
