"use client";

import {
  Typography,
  Space,
} from "antd";

import CustomButton from "@/components/common/CustomButton";

import AnimatedSection from "@/components/common/AnimatedSection";

import {
  colors,
} from "@/styles/theme";

const { Title, Paragraph } = Typography;

export default function Home() {
  return (
    <>
      {/* Background Animation */}
      <style>
        {`
          @keyframes gradientMove {
            0% {
              background-position: 0% 50%;
            }

            50% {
              background-position: 100% 50%;
            }

            100% {
              background-position: 0% 50%;
            }
          }
        `}
      </style>

      <div
        style={{
          minHeight: "100vh",

          display: "flex",
          justifyContent: "center",
          alignItems: "center",

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

          animation:
            "gradientMove 12s ease infinite",

          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Soft Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "rgba(255,255,255,0.15)",
            backdropFilter: "blur(2px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,

            textAlign: "center",

            maxWidth: "700px",
            padding: "20px",
          }}
        >
          {/* Title */}
          <AnimatedSection>
            <Title
              style={{
                color: colors.white,
                fontSize: "64px",
                marginBottom: "10px",
                fontWeight: 700,
              }}
            >
              Elder Care
            </Title>
          </AnimatedSection>

          {/* Paragraph */}
          <AnimatedSection delay={0.4}>
            <Paragraph
              style={{
                color: colors.white,
                fontSize: "20px",
                lineHeight: "1.8",
                marginBottom: "40px",
              }}
            >
              Supporting elderly people with
              care, safety, connection, and
              assistance — all in one place.
            </Paragraph>
          </AnimatedSection>

          {/* Buttons */}
          <AnimatedSection delay={0.8}>
            <Space size="large">
              <CustomButton
                href="/login"
                text="Login"
                primary
              />

              <CustomButton
                href="/register"
                text="Register"
              />
            </Space>
          </AnimatedSection>

          {/* Footer */}
          <AnimatedSection delay={1.2}>
            <div
              style={{
                marginTop: "45px",
                color: colors.white,
                fontSize: "15px",
                letterSpacing: "1px",
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