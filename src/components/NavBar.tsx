"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide-react";

export default function NavBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, userRole, logout } = useAuth();

  const getRoleDisplayName = () => {
    if (userRole === "admin") return "Administrator";
    if (userRole === "responder") return "Responder";
    return "User";
  };
  const roleName = getRoleDisplayName();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Element;
      if (!target.closest(".dropdown")) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  return (
    <nav className="sticky top-0 bg-[#faf5f5] px-4 md:px-6 py-2 md:py-3 flex justify-between items-center z-50 shadow-sm">
      <div className="flex items-center">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="EMERGE Logo"
            width={35}
            height={35}
            className="w-8 h-8 md:w-9 md:h-9"
          />
        </Link>
      </div>

      <ul className="hidden md:flex list-none gap-6 lg:gap-8 flex-grow justify-center items-center px-4">
        <li>
          <Link href="/" className="font-medium text-black hover:text-[#B92727] transition-colors">
            Home
          </Link>
        </li>
        <li>
          <Link href="/hazards" className="font-medium text-black hover:text-[#B92727] transition-colors">
            Risk Map
          </Link>
        </li>
        <li>
          <Link href="/about" className="font-medium text-black hover:text-[#B92727] transition-colors">
            About
          </Link>
        </li>
        {userRole === "admin" && (
          <li>
            <Link href="/admin" className="font-medium text-black hover:text-[#B92727] transition-colors">
              Admin Dashboard
            </Link>
          </li>
        )}
      </ul>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <div className="relative dropdown hidden md:block">
              <button
                className="flex items-center bg-[#B92727] text-white rounded-xl px-3 lg:px-4 py-2 font-bold gap-2"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="flex flex-col items-end mr-2">
                  <span className="text-sm">{user.displayName || user.email?.split("@")[0]}</span>
                  <span className="text-xs font-normal opacity-85 -mt-1">{roleName}</span>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={user.photoURL || "/profile.jpg"}
                    alt="Profile"
                    width={32}
                    height={32}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
              </button>
              {profileOpen && (
                <ul className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 px-2 min-w-[180px] z-50">
                  <li>
                    <Link
                      href={userRole === "admin" ? "/admin/profile" : "/responder/profile"}
                      className="block px-4 py-2 text-black hover:text-[#B92727]"
                    >
                      Edit Profile
                    </Link>
                  </li>
                  <li>
                    <button className="block px-4 py-2 text-black hover:text-[#B92727] w-full text-left" onClick={logout}>
                      Logout
                    </button>
                  </li>
                </ul>
              )}
            </div>
            <button
              onClick={logout}
              className="md:hidden flex items-center justify-center w-8 h-8 text-[#B92727] hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <Link href="/login">
            <button className="bg-[#B92727] text-white rounded-xl px-4 md:px-10 py-2 font-bold text-sm md:text-base">
              Login
            </button>
          </Link>
        )}
      </div>
    </nav>
  );
}
