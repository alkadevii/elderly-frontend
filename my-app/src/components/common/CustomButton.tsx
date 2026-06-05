"use client";

import Link from "next/link";

import { Button } from "antd";

import { motion } from "framer-motion";

import {
  buttonStyles,
  colors,
} from "@/styles/theme";

type Props = {
  href: string;
  text: string;
  primary?: boolean;
};

export default function CustomButton({
  href,
  text,
  primary = false,
}: Props) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{
          scale: 1.08,
          y: -4,
        }}
        whileTap={{
          scale: 0.96,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
        }}
        style={{
          display: "inline-block",
        }}
      >
        <Button
          size="large"
          type={primary ? "primary" : "default"}
          style={{
            ...buttonStyles,

            background: primary
              ? colors.primary
              : "rgba(255,255,255,0.85)",

            color: primary
              ? colors.white
              : colors.textPrimary,

            border: primary
              ? "none"
              : `1px solid ${colors.secondary}`,

            boxShadow:
              "0 8px 20px rgba(0,0,0,0.12)",

            transition: "all 0.3s ease",
          }}
        >
          {text}
        </Button>
      </motion.div>
    </Link>
  );
}