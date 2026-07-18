import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import LockGate from "@/components/LockGate";
import SWRegister from "@/components/SWRegister";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://interview-copilot-u.vercel.app"),
  title: "Interview Copilot",
  description: "Utkarsh's personal AI interview coach — grounded in his resume.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Copilot",
  },
};

export const viewport: Viewport = {
  themeColor: "#e9e5f4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full`}>
      <body className="min-h-full">
        <SWRegister />
        <LockGate>{children}</LockGate>
      </body>
    </html>
  );
}
