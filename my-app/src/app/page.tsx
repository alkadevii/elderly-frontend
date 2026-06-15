"use client";

import {
  Typography,
  Space,
  Row,
  Col,
  Card,
} from "antd";

import {
  HeartOutlined,
  PhoneOutlined,
  SafetyOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import CustomButton from "@/components/common/CustomButton";

import AnimatedSection from "@/components/common/AnimatedSection";

import { colors } from "@/styles/theme";

const { Title, Paragraph } = Typography;

const features = [
  {
    icon: <HeartOutlined style={{ fontSize: 40, color: colors.primary }} />,
    title: "Health Tracking",
    desc: "Monitor medical conditions, medications, and appointments seamlessly.",
  },
  {
    icon: <PhoneOutlined style={{ fontSize: 40, color: colors.secondary }} />,
    title: "Emergency Support",
    desc: "Quick access to emergency contacts when every second counts.",
  },
  {
    icon: <SafetyOutlined style={{ fontSize: 40, color: colors.accent }} />,
    title: "Safety First",
    desc: "Designed with the safety and well-being of elderly loved ones in mind.",
  },
  {
    icon: <TeamOutlined style={{ fontSize: 40, color: "#9B59B6" }} />,
    title: "Family Connection",
    desc: "Keep families connected and informed about their loved ones' care.",
  },
];

export default function Home() {
  return (
    <>
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: `
            linear-gradient(
              -45deg,
              ${colors.primary},
              ${colors.secondary},
              ${colors.background},
              ${colors.accent}
            )
          `,
          backgroundSize: "400% 400%",
          animation: "gradientMove 12s ease infinite",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(2px)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 20px",
          }}
        >
          {/* Decorative Floating Elements */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "8%",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.12)",
              animation: "float 6s ease-in-out infinite",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "20%",
              right: "10%",
              width: 50,
              height: 50,
              borderRadius: "12px",
              background: "rgba(255,255,255,0.10)",
              animation: "float 8s ease-in-out infinite 1s",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "25%",
              left: "12%",
              width: 60,
              height: 60,
              borderRadius: "16px",
              background: "rgba(255,255,255,0.09)",
              animation: "float 7s ease-in-out infinite 2s",
            }}
          />

          {/* Hero Content */}
          <div style={{ textAlign: "center", maxWidth: "800px" }}>
            <AnimatedSection>
              <div
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  padding: "8px 24px",
                  borderRadius: "50px",
                  marginBottom: "24px",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              >
                <span style={{ color: colors.white, fontSize: "14px", fontWeight: 500 }}>
                  Comprehensive Elderly Care Platform
                </span>
              </div>
              <Title
                style={{
                  color: colors.white,
                  fontSize: "72px",
                  marginBottom: "16px",
                  fontWeight: 800,
                  lineHeight: 1.1,
                  textShadow: "0 2px 20px rgba(0,0,0,0.15)",
                }}
              >
                Elder Care
              </Title>
            </AnimatedSection>

            <AnimatedSection delay={0.3}>
              <Paragraph
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "22px",
                  lineHeight: "1.7",
                  marginBottom: "48px",
                  maxWidth: "600px",
                  margin: "0 auto 48px",
                }}
              >
                Supporting elderly people with care, safety, connection, and
                assistance — all in one place.
              </Paragraph>
            </AnimatedSection>

            <AnimatedSection delay={0.6}>
              <Space size="large">
                <CustomButton href="/login" text="Login" primary />
                <CustomButton href="/register" text="Register" />
              </Space>
            </AnimatedSection>
          </div>

          {/* Feature Cards */}
          <AnimatedSection delay={1.0}>
            <Row
              gutter={[24, 24]}
              style={{ maxWidth: "1100px", marginTop: "80px" }}
            >
              {features.map((feature, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                  <Card
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(10px)",
                      borderRadius: "20px",
                      border: "1px solid rgba(255,255,255,0.5)",
                      textAlign: "center",
                      padding: "24px 12px",
                      height: "100%",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                      transition: "transform 0.3s ease",
                    }}
                    hoverable
                  >
                    <div style={{ marginBottom: 16 }}>{feature.icon}</div>
                    <Title level={5} style={{ marginBottom: 8 }}>
                      {feature.title}
                    </Title>
                    <Paragraph
                      style={{
                        color: colors.textSecondary,
                        fontSize: "13px",
                        marginBottom: 0,
                      }}
                    >
                      {feature.desc}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </AnimatedSection>

          {/* Action Buttons for Mobile */}
          <AnimatedSection delay={1.3}>
            <div
              style={{
                display: "none",
                marginTop: "48px",
              }}
              className="mobile-cta"
            >
              <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
                <CustomButton href="/login" text="Login" primary />
                <CustomButton href="/register" text="Register" />
              </Space>
            </div>
          </AnimatedSection>

          {/* Footer */}
          <AnimatedSection delay={1.5}>
            <div
              style={{
                marginTop: "60px",
                color: "rgba(255,255,255,0.75)",
                fontSize: "15px",
                letterSpacing: "1px",
                textAlign: "center",
              }}
            >
              Caring beyond technology.
            </div>
          </AnimatedSection>
        </div>
      </div>
    </>
  );
}