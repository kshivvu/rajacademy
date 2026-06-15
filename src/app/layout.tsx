import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Raj Academy | Small Batches. Strong Foundations.",
  description:
    "Premium Mathematics & Science tuition academy in Kurji, Vikas Nagar, Patna. Max 15 students per batch, concept clarity, weekly assessments, and personal attention.",
  keywords: [
    "Raj Academy",
    "Tuition Patna",
    "Math Coaching Patna",
    "Science Coaching Kurji",
    "Class 10 Board Math",
    "Class 11 12 Mathematics",
    "Boring Road Tuition",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" style={{ scrollBehavior: "smooth" }}>
      <body className={`${body.variable} ${display.variable}`}>
        {children}
      </body>
    </html>
  );
}
