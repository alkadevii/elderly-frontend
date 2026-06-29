"use client";

import { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Card,
  Avatar,
  Typography,
  Row,
  Col,
  Button,
  Tag,
  Steps,
  Result,
} from "antd";
import {
  UserOutlined,
  HomeOutlined,
  HeartOutlined,
  LogoutOutlined,
  CalendarOutlined,
  PhoneOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  LockOutlined,
  SolutionOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  DashboardOutlined,
  FileTextOutlined,

} from "@ant-design/icons";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { colors } from "@/styles/theme";
import type { User } from "@/types/User";
import type { MedicalCondition } from "@/types/MedicalCondition";
import type { EmergencyContact } from "@/types/EmergencyContact";
import type { Appointment } from "@/types/Appointment";
import { getMedicalConditions } from "@/services/medicalConditionService";
import { getEmergencyContacts } from "@/services/emergencyContactService";
import { getAppointments } from "@/services/appointmentService";
import AppointmentSection from "./AppointmentSection";
import EmergencyContactSection from "./EmergencyContactSection";
import MedicalConditionSection from "./MedicalConditionSection";
import MedicationSection from "./MedicationSection";
import VitalsSection from "./VitalsSection";
import MedicationLogSection from "./MedicationLogSection";
import MedicationReminderBanner from "./MedicationReminderBanner";
import DashboardAnalytics from "./DashboardAnalytics";
import UserFeedbackSection from "./UserFeedbackSection";


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
  const [medicalConditions, setMedicalConditions] = useState<MedicalCondition[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const isVerified = user.verificationStatus === "verified";
  const isRejected = user.verificationStatus === "rejected";
  const hasAssignedStaff = !!user.assignedStaff;
  const isFullyVerified = isVerified && hasAssignedStaff;

  useEffect(() => {
    if (!isFullyVerified) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [mcRes, ecRes, appRes] = await Promise.all([
          getMedicalConditions(),
          getEmergencyContacts(),
          getAppointments(),
        ]);
        if (!cancelled) {
          setMedicalConditions(Array.isArray(mcRes) ? mcRes : (mcRes.data || mcRes.conditions || []));
          setEmergencyContacts(Array.isArray(ecRes) ? ecRes : (ecRes.data || ecRes.contacts || []));
          setAppointments(Array.isArray(appRes) ? appRes : (appRes.data || appRes.appointments || []));
        }
      } catch {
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isFullyVerified]);

  const getSetupStep = () => {
    if (isFullyVerified) return 3;
    if (isVerified && !hasAssignedStaff) return 2;
    if (profileCompleted) return 1;
    return 0;
  };

  const renderLockedFeature = (title: string, icon: React.ReactNode, description: string) => (
    <Result
      icon={icon}
      title={title}
      subTitle={description}
      extra={
        !profileCompleted ? (
          <Button type="primary" onClick={onCompleteProfile}>
            Complete Profile First
          </Button>
        ) : !isVerified ? (
          <Paragraph style={{ color: colors.textSecondary }}>
            Your profile is under review. An admin will verify it soon.
          </Paragraph>
        ) : !hasAssignedStaff ? (
          <Paragraph style={{ color: colors.textSecondary }}>
            An admin will assign a staff member to you shortly.
          </Paragraph>
        ) : null
      }
    />
  );

  const renderContent = () => {
    if (!isFullyVerified) {
      switch (activeKey) {
        case "1":
          return renderSetupGuide();
        case "2":
          return renderLockedFeature(
            "Appointments",
            <CalendarOutlined style={{ color: colors.primary }} />,
            "Manage your doctor appointments and track upcoming visits."
          );
        case "3":
          return renderLockedFeature(
            "Emergency Contacts",
            <PhoneOutlined style={{ color: colors.primary }} />,
            "Store emergency contact details for quick access."
          );
        case "4":
          return renderLockedFeature(
            "Medical Conditions",
            <HeartOutlined style={{ color: colors.primary }} />,
            "Record and track your medical conditions."
          );
        case "5":
          return renderLockedFeature(
            "Medications",
            <MedicineBoxOutlined style={{ color: colors.primary }} />,
            "Manage your prescribed medications."
          );
        case "6":
          return renderLockedFeature(
            "Vitals",
            <DashboardOutlined style={{ color: colors.primary }} />,
            "Log and track your vital signs over time."
          );
        case "7":
          return renderLockedFeature(
            "Medication Logs",
            <FileTextOutlined style={{ color: colors.primary }} />,
            "Track your medication adherence and view history."
          );

        default:
          return renderSetupGuide();
      }
    }

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
        return <VitalsSection />;
      case "7":
        return <MedicationLogSection />;

      default:
        return renderOverview();
    }
  };

  const renderSetupGuide = () => (
    <div>
      <Card style={{ marginBottom: 24, borderRadius: 16 }}>
        <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
          Follow these steps to unlock all Elder Care features:
        </Paragraph>
        <Steps
          current={getSetupStep()}
          orientation="vertical"
          items={[
            {
              title: "Complete Your Profile",
              content: "Add your personal details, emergency notes, and medical information.",
              status: profileCompleted ? "finish" : getSetupStep() === 0 ? "process" : "finish",
              icon: profileCompleted ? <CheckCircleOutlined /> : <SolutionOutlined />,
            },
            {
              title: "Profile Verification",
              content: isRejected
                ? "Your profile was rejected. Please update your profile and try again."
                : "An admin will review and verify your profile.",
              status: isVerified ? "finish" : isRejected ? "error" : getSetupStep() >= 1 ? "process" : "wait",
              icon: isVerified ? <CheckCircleOutlined /> : isRejected ? <CloseCircleOutlined /> : <SafetyCertificateOutlined />,
            },
            {
              title: "Staff Assignment",
              content: "An admin will assign a dedicated staff member to support you.",
              status: hasAssignedStaff ? "finish" : getSetupStep() >= 2 ? "process" : "wait",
              icon: hasAssignedStaff ? <CheckCircleOutlined /> : <TeamOutlined />,
            },
            {
              title: "Features Unlocked",
              content: "Access appointments, medications, emergency contacts, and more.",
              status: isFullyVerified ? "finish" : "wait",
              icon: isFullyVerified ? <CheckCircleOutlined /> : <LockOutlined />,
            },
          ]}
        />

        {!profileCompleted && (
          <div style={{ marginTop: 24 }}>
            <Button type="primary" size="large" onClick={onCompleteProfile}>
              Complete Your Profile
            </Button>
          </div>
        )}
      </Card>

      <Card style={{ borderRadius: 16, background: "#f0f7ff", border: "1px solid #bfdbfe" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <ClockCircleOutlined style={{ fontSize: 20, color: colors.primary, marginTop: 2 }} />
          <div>
            <Title level={5} style={{ color: colors.primary, marginBottom: 4 }}>
              What happens next?
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              {!profileCompleted
                ? "Start by completing your profile with your personal details. Once done, an admin will verify your information and assign a staff member to support you."
                : !isVerified
                ? "Your profile has been submitted for review. An admin will verify your information soon. You'll be notified once the verification is complete."
                : !hasAssignedStaff
                ? "Your profile has been verified! An admin will now assign a staff member to you. This usually happens within a short time."
                : "Your setup is complete! You now have full access to all Elder Care features."}
            </Paragraph>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderOverview = () => {
    const today = dayjs().startOf("day");
    const upcomingAppointments = appointments
      .filter((a) => a.status === "scheduled" && dayjs(a.appointmentDate).startOf("day").valueOf() >= today.valueOf())
      .sort((a, b) => dayjs(a.appointmentDate).valueOf() - dayjs(b.appointmentDate).valueOf());

    return (
    <>
      <Card style={{ marginTop: 24, marginBottom: 24, borderRadius: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Avatar size={90} src={user.profileImage} icon={<UserOutlined />} />
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>
              Welcome Back, {user.name}
            </Title>
            <Paragraph style={{ color: colors.textSecondary, marginBottom: 4 }}>
              {user.email}
            </Paragraph>
            <Paragraph style={{ color: colors.textSecondary, marginBottom: 0 }}>
              {user.role === "admin" ? "Administrator" : "Member"}
            </Paragraph>
          </div>
        </div>
      </Card>

      <MedicationReminderBanner />

      <div style={{ marginBottom: 24 }}>
        <UserFeedbackSection />
      </div>

      {upcomingAppointments.length > 0 && (
        <Card
          style={{ marginBottom: 24, borderRadius: 16, border: "1px solid #0891b2", background: "#ecfeff" }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <BellOutlined style={{ fontSize: 20, color: "#0891b2", marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <Title level={5} style={{ color: "#0891b2", marginBottom: 12 }}>
                Upcoming Appointments ({upcomingAppointments.length})
              </Title>
              {upcomingAppointments.map((appt) => {
                const daysUntil = dayjs(appt.appointmentDate).startOf("day").diff(today, "day");
                return (
                  <div key={appt._id} style={{ padding: "8px 0", borderBottom: "1px solid #cffafe" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <Paragraph strong style={{ marginBottom: 2 }}>{appt.doctorName}</Paragraph>
                        <span style={{ fontSize: 13, color: colors.textSecondary }}>
                          {appt.hospital ? `${appt.hospital} • ` : ""}
                          {dayjs(appt.appointmentDate).format("MMM D, YYYY")}
                        </span>
                      </div>
                      <Tag color={daysUntil === 0 ? "red" : daysUntil <= 3 ? "orange" : "cyan"}>
                        {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                      </Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{user.dateOfBirth ? dayjs().diff(dayjs(user.dateOfBirth), "year") : "--"}</Title>
            <Paragraph>Age</Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>
              {user.phone ? (
                <CheckCircleOutlined style={{ color: "#10b981" }} />
              ) : (
                <CloseCircleOutlined style={{ color: "#cbd5e1" }} />
              )}
            </Title>
            <Paragraph>Phone</Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{emergencyContacts.length}</Title>
            <Paragraph>Emergency Contacts</Paragraph>
          </Card>
        </Col>
        <Col span={6}>
          <Card style={{ borderRadius: 16, textAlign: "center" }}>
            <Title level={3}>{medicalConditions.length}</Title>
            <Paragraph>Medical Conditions</Paragraph>
          </Card>
        </Col>
      </Row>

      <Row gutter={20}>
        <Col span={8}>
          <Card
            title={<span><UserOutlined style={{ marginRight: 8 }} />Basic Information</span>}
            style={{ borderRadius: 16, height: "100%" }}
          >
            <p><strong>Date of Birth:</strong> {user.dateOfBirth ? dayjs(user.dateOfBirth).format("MMM D, YYYY") : "-"}</p>
            <p><strong>Age:</strong> {user.dateOfBirth ? dayjs().diff(dayjs(user.dateOfBirth), "year") : "-"}</p>
            <p><strong>Gender:</strong> {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "-"}</p>
            <p><strong>Blood Group:</strong> {user.bloodGroup || "-"}</p>
            <p><strong>Phone:</strong> {user.phone || "-"}</p>
            <p><strong>Address:</strong> {user.address || "-"}</p>
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={<span><PhoneOutlined style={{ marginRight: 8 }} />Emergency Contacts</span>}
            style={{ borderRadius: 16, height: "100%" }}
          >
            {emergencyContacts.length === 0 ? (
              <Paragraph style={{ color: colors.textSecondary }}>
                No emergency contacts added yet.
              </Paragraph>
            ) : (
              <div>
                {emergencyContacts.map((contact) => (
                  <div key={contact._id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <Paragraph strong style={{ marginBottom: 4 }}>{contact.name}</Paragraph>
                    <span>
                      <Tag color="blue">{contact.relationship}</Tag>
                      {contact.phone}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title={<span><HeartOutlined style={{ marginRight: 8 }} />Medical Conditions</span>}
            style={{ borderRadius: 16, height: "100%" }}
          >
            {medicalConditions.length === 0 ? (
              <Paragraph style={{ color: colors.textSecondary }}>
                No medical conditions recorded.
              </Paragraph>
            ) : (
              <div>
                {medicalConditions.map((condition) => (
                  <div key={condition._id} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                    <Paragraph strong style={{ marginBottom: 4 }}>{condition.condition}</Paragraph>
                    {condition.diagnosedDate && (
                      <span style={{ fontSize: "12px", color: colors.textSecondary }}>
                        Diagnosed: {dayjs(condition.diagnosedDate).format("MMM D, YYYY")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <DashboardAnalytics />
      </div>
    </>
    );
  };

  const pendingConfirmationCount = appointments.filter(
    (a) => a.status === "pending_confirmation"
  ).length;

  const menuItems = [
    { key: "1", icon: <HomeOutlined />, label: "Dashboard" },
    {
      key: "2",
      icon: isFullyVerified ? <CalendarOutlined /> : <LockOutlined />,
      label: (
        <span style={pendingConfirmationCount > 0 ? { color: "#ef4444", fontWeight: 600 } : undefined}>
          Appointments{pendingConfirmationCount > 0 ? ` (${pendingConfirmationCount})` : ""}
        </span>
      ),
      disabled: !isFullyVerified,
    },
    {
      key: "3",
      icon: isFullyVerified ? <PhoneOutlined /> : <LockOutlined />,
      label: "Emergency Contacts",
      disabled: !isFullyVerified,
    },
    {
      key: "4",
      icon: isFullyVerified ? <HeartOutlined /> : <LockOutlined />,
      label: "Medical Conditions",
      disabled: !isFullyVerified,
    },
    {
      key: "5",
      icon: isFullyVerified ? <MedicineBoxOutlined /> : <LockOutlined />,
      label: "Medications",
      disabled: !isFullyVerified,
    },
    {
      key: "6",
      icon: isFullyVerified ? <DashboardOutlined /> : <LockOutlined />,
      label: "Vitals",
      disabled: !isFullyVerified,
    },
    {
      key: "7",
      icon: isFullyVerified ? <FileTextOutlined /> : <LockOutlined />,
      label: "Medication Logs",
      disabled: !isFullyVerified,
    },

  ];

  const getHeading = () => {
    const labels: Record<string, string> = {
      "1": isFullyVerified ? "Dashboard" : "Account Setup",
      "2": "Appointments",
      "3": "Emergency Contacts",
      "4": "Medical Conditions",
      "5": "Medications",
      "6": "Vitals",
      "7": "Medication Logs",

    };
    return labels[activeKey] || "";
  };

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
                items={menuItems}
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
              {getHeading()}
            </Title>
            <Avatar size={50} src={user.profileImage} icon={<UserOutlined />} />
          </div>

          {renderContent()}
        </Content>
      </Layout>
    </motion.div>
  );
}
