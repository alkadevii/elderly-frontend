export const colors = {
  // Primary Palette
  primary: "#4A90E2", // Soft Blue
  secondary: "#7FB77E", // Sage Green
  accent: "#F4C95D", // Soft Gold

  // Backgrounds
  background: "#F8FAFC", // Warm White
  cardBackground: "#FFFDF7", // Light Cream

  // Text
  textPrimary: "#1F2937", // Dark Slate
  textSecondary: "#6B7280", // Gray

  // Utility
  white: "#FFFFFF",
  overlay: "rgba(0,0,0,0.40)",
};

export const buttonStyles = {
  borderRadius: "12px",
  paddingInline: "40px",
  height: "48px",
  fontSize: "16px",
  fontWeight: 500,
};

export const pageStyles = {
  heroContainer: {
    minHeight: "100vh",

    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",

    display: "flex",
    justifyContent: "center",
    alignItems: "center",

    position: "relative" as const,
    overflow: "hidden",

    backgroundColor: colors.background,
  },

  overlay: {
    position: "absolute" as const,
    inset: 0,
    background: colors.overlay,
  },

  content: {
    position: "relative" as const,
    zIndex: 1,

    textAlign: "center" as const,

    padding: "20px",
    maxWidth: "700px",
  },

  card: {
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(8px)",
    borderRadius: "24px",
    border: "none",

    boxShadow:
      "0 10px 30px rgba(0,0,0,0.10)",
  },
};

export const typographyStyles = {
  heroTitle: {
    color: colors.white,
    fontSize: "64px",
    fontWeight: 700,
    marginBottom: "10px",
  },

  heroParagraph: {
    color: colors.background,
    fontSize: "20px",
    lineHeight: "1.8",
    marginBottom: "40px",
  },

  footerText: {
    color: "#E5E7EB",
    fontSize: "15px",
    letterSpacing: "1px",
  },
};