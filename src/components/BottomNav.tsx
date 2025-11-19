"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { Home, Map, Info, UserCircle, LayoutDashboard } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, userRole } = useAuth();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/hazards", icon: Map, label: "Map" },
    { href: "/about", icon: Info, label: "About" },
  ];

  if (userRole === "admin") {
    navItems.push({ href: "/admin", icon: LayoutDashboard, label: "Admin" });
  }

  if (user) {
    const profilePath = userRole === "admin" ? "/admin/profile" : "/responder/profile";
    navItems.push({ href: profilePath, icon: UserCircle, label: "Profile" });
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive(href)
                ? "text-[#B92727]"
                : "text-gray-600 hover:text-[#B92727]"
            }`}
          >
            <Icon size={24} strokeWidth={isActive(href) ? 2.5 : 2} />
            <span className="text-xs font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
