"use client";

import { useState } from "react";
import {
  Layout,
  Menu,
  Card,
  Avatar,
  Typography,
  Row,
  Col,
  Button,
} from "antd";

import {
  UserOutlined,
  HomeOutlined,
  HeartOutlined,
  SettingOutlined,
  LogoutOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
} from "@ant-design/icons";

import { motion } from "framer-motion";

import { colors } from "@/styles/theme";
import type { User } from "@/types/User";
import AppointmentSection from "./AppointmentSection";
import EmergencyContactSection from "./EmergencyContactSection";
import MedicalConditionSection from "./MedicalConditionSection";
import MedicationSection from "./MedicationSection";

const { Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

type Props = {
  user: User;
  profileCompleted?: boolean;
  onCompleteProfile?: () => void;
  onLogout: () => void;
};

export default function UserDashboard({
  user,
  profileCompleted,
  onCompleteProfile,
  onLogout,
}: Props) {
  const [activeKey, setActiveKey] = useState("1");

  const renderContent = () => {
    switch (activeKey) {
      case "1":
        return renderOverview();
      case "2":
        return <AppointmentSection />;
      case "3":
        return <EmergencyContactSection />;
      case "4":
        return <MedicalConditionSection />;
      case "5":
        return <MedicationSection />;
      case "6":
        return (
          <Card>
            <Title level={4}>Settings</Title>
            <Paragraph>Settings panel coming soon.</Paragraph>
          </Card>
        );
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      <Title level={3} style={{ margin: 0 }}>
        Dashboard
      </Title>

      <Card style={{ marginTop: 24, marginBottom: 24, borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Avatar size={90} src={user.profileImage} icon={<UserOutlined />} />
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>
              Welcome Back, {user.name}
            </Title>
            <Paragraph style={{ color: colors.textSecondary }}>
              {user.email}
            </Paragraph>
          </div>
        </div>
      </Card>

      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{user.age || "--"}</Title>
            <Paragraph>Age</Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{user.phone ? "\u2713" : "--"}</Title>
            <Paragraph>Phone Added</Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{user.emergencyContact ? "\u2713" : "--"}</Title>
            <Paragraph>Emergency Contact</Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{user.medicalConditions ? "\u2713" : "--"}</Title>
            <Paragraph>Medical Records</Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={20}>
        <Col span={8}>
          <Card title="Basic Information" style={{ borderRadius: 16, height: "100%" }}>
            <p><strong>Age:</strong> {user.age || "-"}</p>
            <p><strong>Phone:</strong> {user.phone || "-"}</p>
            <p><strong>Address:</strong> {user.address || "-"}</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Emergency Contact" style={{ borderRadius: 16, height: "100%" }}>
            <p>{user.emergencyContact || "Not Added"}</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Medical Conditions" style={{ borderRadius: 16, height: "100%" }}>
            <p>{user.medicalConditions || "No Medical Conditions Added"}</p>
          </Card>
        </Col>
      </Row>
    </>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Layout
        style={{
          minHeight: "90vh",
          width: "95vw",
          maxWidth: "1500px",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "24px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        }}
      >
        <Sider
          width={250}
          theme="light"
          style={{
            background: colors.cardBackground,
            borderRight: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ padding: "30px 20px" }}>
                <Title level={4} style={{ color: colors.primary, margin: 0 }}>
                  Elder Care
                </Title>
              </div>

              <Menu
                mode="inline"
                selectedKeys={[activeKey]}
                onClick={({ key }) => setActiveKey(key)}
                items={[
                  { key: "1", icon: <HomeOutlined />, label: "Dashboard" },
                  { key: "2", icon: <CalendarOutlined />, label: "Appointments" },
                  { key: "3", icon: <PhoneOutlined />, label: "Emergency Contacts" },
                  { key: "4", icon: <HeartOutlined />, label: "Medical Conditions" },
                  { key: "5", icon: <MedicineBoxOutlined />, label: "Medications" },
                  { key: "6", icon: <SettingOutlined />, label: "Settings" },
                ]}
              />
            </div>

            <div style={{ padding: 20 }}>
              <Button
                danger
                block
                icon={<LogoutOutlined />}
                onClick={onLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </Sider>

        <Content style={{ padding: "30px", background: "transparent" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Title level={3} style={{ margin: 0 }}>
              Dashboard
            </Title>
            <Avatar size={50} src={user.profileImage} icon={<UserOutlined />} />
          </div>

          <Card
            style={{
              marginBottom: 24,
              borderRadius: 16,
              border: profileCompleted ? "1px solid #10b981" : "1px solid #f59e0b",
              background: profileCompleted ? "#ecfdf5" : "#fff7e6",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
              }}
            >
              <div>
                <Title
                  level={5}
                  style={{
                    marginBottom: 4,
                    color: profileCompleted ? "#059669" : "#d97706",
                  }}
                >
                  {profileCompleted ? "Profile Completed" : "Profile Incomplete"}
                </Title>
                <Paragraph style={{ marginBottom: 0 }}>
                  {profileCompleted
                    ? "You can update your profile anytime."
                    : "Complete your profile to unlock all Elder Care features."}
                </Paragraph>
              </div>
              <Button type="primary" onClick={onCompleteProfile}>
                {profileCompleted ? "Edit Profile" : "Complete Profile"}
              </Button>
            </div>
          </Card>

          {renderContent()}
        </Content>
      </Layout>
    </motion.div>
  );
}
