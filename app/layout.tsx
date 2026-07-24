import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import WelcomeModal from "@/components/layout/WelcomeModal";
import CookieBanner from "@/components/ui/CookieBanner";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "觉察",
  description: "觉察 - 你的认知之镜",
};

import type { Viewport } from 'next'
import { PHProvider } from './providers'
import PostHogPageView from './PostHogPageView'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'resizes-content',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-background">
        <PHProvider>
          <PostHogPageView />
          <AuthProvider>
            <Header />
            {children}
            <Footer />
            <Suspense fallback={null}>
              <WelcomeModal />
            </Suspense>
            <CookieBanner />
          </AuthProvider>
        </PHProvider>
      </body>
    </html>
  );
}
