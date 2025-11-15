import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: allow global CSS side-effect import without module declarations
import "./globals.css";
import HideableNav from "../components/HideableNav";
import Footer from "../components/footer";
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
  description: "Created with love by the EMERGE TEAM!",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} antialiased`}
      >
        <AuthProvider>
          <HazardProvider>
            <HideableNav />
            {children}
            <Footer />
          </HazardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
