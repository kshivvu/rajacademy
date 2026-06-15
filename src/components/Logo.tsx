"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = "", size = 60 }: LogoProps) {
  return (
    <div 
      className={`logo-container ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        position: "relative", 
        display: "inline-flex", 
        alignItems: "center", 
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "rotate(10deg) scale(1.08)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "rotate(0deg) scale(1)";
        }}
      >
        {/* Outer Circular Ring with Gold Gradient */}
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke="url(#goldGradientLogo)"
          strokeWidth="2.5"
          fill="rgba(10, 29, 55, 0.95)"
        />
        
        {/* Inner Dotted Ring */}
        <circle
          cx="50"
          cy="50"
          r="41"
          stroke="url(#goldGradientLogo)"
          strokeWidth="0.75"
          strokeDasharray="3 2"
          fill="none"
          opacity="0.8"
        />

        {/* Serif Letter R */}
        <text
          x="36"
          y="63"
          fontFamily="var(--font-serif), 'Playfair Display', Georgia, serif"
          fontSize="36"
          fontWeight="bold"
          fill="url(#goldGradientLogo)"
          style={{ userSelect: "none" }}
        >
          R
        </text>

        {/* Sans/Light Letter A */}
        <text
          x="58"
          y="63"
          fontFamily="var(--font-serif), 'Playfair Display', Georgia, serif"
          fontSize="36"
          fontWeight="300"
          fill="url(#goldGradientLogo)"
          style={{ userSelect: "none" }}
        >
          A
        </text>

        {/* Linear Gradient Definition */}
        <defs>
          <linearGradient id="goldGradientLogo" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FAF6F0" />
            <stop offset="30%" stopColor="#F5D061" />
            <stop offset="70%" stopColor="#C59B27" />
            <stop offset="100%" stopColor="#9A7516" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
