import RegisterForm from "@/components/RegisterForm";

import { colors } from "@/styles/theme";

export default function RegisterPage() {
  return (
    <>
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

          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "rgba(255,255,255,0.12)",
            backdropFilter: "blur(2px)",
          }}
        />

        {/* Form */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
          }}
        >
          <RegisterForm />
        </div>
      </div>
    </>
  );
}