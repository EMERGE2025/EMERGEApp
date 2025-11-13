"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Disclosure } from "@headlessui/react";
import { useAuth } from "../contexts/AuthContext";
import { useHazard } from "../contexts/HazardContext";

export default function NavBar() {
  const [mapsOpen, setMapsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Get the new userRole from the context
  const { user, userRole, logout } = useAuth();
  const { hazardType, setHazardType } = useHazard();

  // Helper to get the display name for the role
  const getRoleDisplayName = () => {
    if (userRole === "admin") {
      return "Administrator";
    }
    if (userRole === "responder") {
      return "Responder";
    }
    return "User";
  };
  const roleName = getRoleDisplayName();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Element;
      if (!target.closest(".dropdown")) {
        setMapsOpen(false);
        setProfileOpen(false);
      }
    }
    if (mapsOpen || profileOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mapsOpen, profileOpen]);

  return (
    <nav className="sticky top-0 bg-[#faf5f5] px-4 md:px-6 py-2 md:py-3 flex justify-between align-center z-1000 shadow min-h-[60px] md:min-h-[64px]">
      <div className="flex items-center">
        <Link href="/">
          {" "}
          <Image
            src="/logo.svg"
            alt="EMERGE Logo"
            width={35}
            height={35}
          />{" "}
        </Link>
      </div>
      <div className="flex items-center justify">
        <Disclosure>
          {({ open, close }) => (
            <>
              <Disclosure.Button
                className="sm:hidden w-10 h-10 rounded focus:outline-none"
                aria-label="Toggle navigation"
              >
                <span
                  className={`block h-1 w-7 rounded bg-[#b92727] mb-1 transition-all duration-300 ${
                    open ? "rotate-45 translate-y-2" : ""
                  }`}
                ></span>
                <span
                  className={`block h-1 w-7 rounded bg-[#b92727] mb-1 transition-all duration-300 ${
                    open ? "opacity-0" : ""
                  }`}
                ></span>
                <span
                  className={`block h-1 w-7 rounded bg-[#b92727] transition-all duration-300 ${
                    open ? "-rotate-45 -translate-y-2" : ""
                  }`}
                ></span>
              </Disclosure.Button>

              <ul className="hidden sm:flex list-none gap-8 flex-grow justify-center items-center px-10">
                <li>
                  <Link
                    href="/"
                    className="font-medium text-black hover:text-[#B92727] transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li className="relative group">
                  <button
                    className="font-medium text-black hover:text-[#B92727] transition-colors flex items-center gap-1"
                    aria-expanded={mapsOpen}
                    onClick={() => setMapsOpen((open) => !open)}
                  >
                    Maps <span className="text-xs">▼</span>
                  </button>
                  {mapsOpen && (
                    <ul className="absolute left-0 top-8 bg-white rounded-lg shadow-lg py-2 px-2 min-w-[180px] z-50">
                      <li>
                        <Link
                          href="/hazards"
                          className="block px-4 py-2 text-black hover:text-[#B92727]"
                          onClick={() => setMapsOpen(false)}
                        >
                          Risk Map
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/hazards"
                          className="block px-4 py-2 text-black hover:text-[#B92727]"
                          onClick={() => setMapsOpen(false)}
                        >
                          Hazard Visualization
                        </Link>
                      </li>
                    </ul>
                  )}
                </li>
                <li>
                  <Link
                    href="/about"
                    className="font-medium text-black hover:text-[#B92727] transition-colors"
                  >
                    About
                  </Link>
                </li>

                {/* --- UPDATED: Use userRole --- */}
                {userRole === "admin" && (
                  <li>
                    <Link
                      href="/admin" // Changed from /update to /admin
                      className="font-medium text-black hover:text-[#B92727] transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  </li>
                )}
              </ul>

              {user ? (
                <div className="relative dropdown">
                  <button
                    className="hidden sm:flex items-center bg-[#B92727] text-white rounded-xl px-4 py-2 font-bold gap-2"
                    onClick={() => setProfileOpen(!profileOpen)}
                  >
                    <div className="flex flex-col items-end mr-2">
                      <span>
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                      {/* --- UPDATED: Use roleName --- */}
                      <span className="text-xs font-normal opacity-85 -mt-1">
                        {roleName}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-full overflow-hidden">
                      <Image
                        src={user.photoURL || "/profile.jpg"}
                        alt="Profile"
                        width={36}
                        height={36}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  </button>
                  {profileOpen && (
                    <ul className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 px-2 min-w-[180px] z-50">
                      <li>
                        <Link
                          href="/profile" // Link to a profile page
                          className="block px-4 py-2 text-black hover:text-[#B92727] w-full text-left"
                        >
                          Edit Profile
                        </Link>
                      </li>
                      <li>
                        <button
                          className="block px-4 py-2 text-black hover:text-[#B92727] w-full text-left"
                          onClick={logout}
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <button className="hidden sm:flex items-center bg-[#B92727] text-white rounded-xl px-10 py-2 font-bold">
                    Login
                  </button>
                </Link>
              )}

              <Disclosure.Panel>
                <div
                  className="fixed inset-0 bg-black/40 z-[9999] md:hidden"
                  onClick={() => close()}
                ></div>
                <div
                  className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-[#faf5f5] shadow-lg z-[10000] transform transition-transform duration-300 md:hidden ${
                    open ? "translate-x-0" : "-translate-x-full"
                  }`}
                >
                  <div className="flex flex-col h-full p-6">
                    <button
                      className="self-end mb-6"
                      onClick={() => close()}
                      aria-label="Close menu"
                    >
                      <span className="text-3xl text-[#b92727]">×</span>
                    </button>
                    <ul className="flex flex-col gap-6 text-lg">
                      <li>
                        <Link
                          href="/"
                          className="font-medium text-black hover:text-[#B92727]"
                        >
                          Home
                        </Link>
                      </li>
                      <li>
                        <button>
                          <Link
                            href="/hazards"
                            className="text-black hover:text-[#B92727]"
                          >
                            Risk Map
                          </Link>
                        </button>
                      </li>
                      <li>
                        <Link
                          href="/about"
                          className="font-medium text-black hover:text-[#B92727]"
                        >
                          About
                        </Link>
                      </li>

                      {/* --- UPDATED: Use userRole --- */}
                      {userRole === "admin" && (
                        <li>
                          <Link
                            href="/admin"
                            className="font-medium text-black hover:text-[#B92727]"
                          >
                            Admin Dashboard
                          </Link>
                        </li>
                      )}
                    </ul>

                    {user ? (
                      <div className="mt-auto flex items-center bg-[#B92727] text-white rounded-xl px-4 py-2 font-bold gap-2">
                        <div className="flex flex-col items-end mr-2">
                          <span>
                            {user.displayName || user.email?.split("@")[0]}
                          </span>
                          {/* --- UPDATED: Use roleName --- */}
                          <span className="text-xs font-normal opacity-85 -mt-1">
                            {roleName}
                          </span>
                        </div>
                        <div className="w-9 h-9 rounded-full overflow-hidden">
                          <Image
                            src={user.photoURL || "/profile.jpg"}
                            alt="Profile"
                            width={36}
                            height={36}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <Link href="/login">
                        <button className="mt-auto bg-[#B92727] text-white rounded-xl px-4 py-2 font-bold">
                          Login
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>
      </div>
    </nav>
  );
}
