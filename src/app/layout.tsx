import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "../components/NavBar";
import BottomNav from "../components/BottomNav";
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
            <NavBar />
            <main className="pb-16 md:pb-0">{children}</main>
            <BottomNav />
          </HazardProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
