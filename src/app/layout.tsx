import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: allow global CSS side-effect import without module declarations
import "./globals.css";
import HideableNav from "../components/HideableNav";
import Footer from "../components/footer";
import InstallPrompt from "../components/InstallPrompt";
import { Archivo } from "next/font/google";
import { AuthProvider } from "../contexts/AuthContext";
import { HazardProvider } from "../contexts/HazardContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EMERGE",
  description:
    "Emergency Responder Allocation System for Hazard Mapping and Planning in Santa Barbara, Iloilo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EMERGE",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192x192.png", sizes: "192x192", type: "image/png" }],
  },
};

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="EMERGE" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EMERGE" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#B92727" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} antialiased`}
      >
        <AuthProvider>
          <HazardProvider>
            {/* Conditional navigation (handles both top and bottom navs) */}
            <HideableNav />
            <main className="pb-16 md:pb-0">{children}</main>
            <InstallPrompt />
          </HazardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
