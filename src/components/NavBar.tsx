"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "../contexts/AuthContext";
import { LogOut } from "lucide-react";
import { UserCircleDashedIcon } from "@phosphor-icons/react/dist/ssr";
import { db } from "@/utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function NavBar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, userRole, logout } = useAuth();
  const [adminProfile, setAdminProfile] = useState<{
    name?: string;
    profilePictureUrl?: string;
  } | null>(null);

  // Compress base64 image to 100x100
  const compressBase64Image = (base64OrDataUri: string, maxSize: number = 100): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        resolve(base64OrDataUri);
        return;
      }
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Could not get canvas context');
          return;
        }
        ctx.drawImage(img, 0, 0, maxSize, maxSize);
        // Return full data URI
        const compressedDataUri = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUri);
      };
      img.onerror = () => reject('Failed to load image');
      // Handle both full data URI and base64-only string
      img.src = base64OrDataUri.startsWith('data:') ? base64OrDataUri : `data:image/jpeg;base64,${base64OrDataUri}`;
    });
  };

  const getRoleDisplayName = () => {
    if (userRole === "admin") return "Administrator";
    if (userRole === "responder") return "Responder";
    return "User";
  };
  const roleName = getRoleDisplayName();

  // Fetch admin profile from ADMINISTRATORS document with real-time updates
  useEffect(() => {
    if (!user || userRole !== "admin") {
      return;
    }

    const adminDocRef = doc(db, "ADMINISTRATORS", user.uid);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      adminDocRef,
      async (adminDoc) => {
        if (adminDoc.exists()) {
          const data = adminDoc.data();

          // Compress the profile picture if it exists
          let compressedImage = data.profilePictureUrl;
          if (data.profilePictureUrl) {
            try {
              compressedImage = await compressBase64Image(data.profilePictureUrl, 100);
            } catch (error) {
              console.error("Error compressing image:", error);
              // Use original if compression fails
              compressedImage = data.profilePictureUrl;
            }
          }

          setAdminProfile({
            name: data.name,
            profilePictureUrl: compressedImage,
          });
        }
      },
      (error) => {
        console.error("Error listening to admin profile:", error);
      }
    );

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, userRole]);

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
          <Link
            href="/"
            className="font-medium text-black hover:text-[#B92727] transition-colors"
          >
            Home
          </Link>
        </li>
        <li>
          <Link
            href="/hazards"
            className="font-medium text-black hover:text-[#B92727] transition-colors"
          >
            Risk Map
          </Link>
        </li>
        <li>
          <Link
            href="/about"
            className="font-medium text-black hover:text-[#B92727] transition-colors"
          >
            About
          </Link>
        </li>
        {userRole === "admin" && (
          <li>
            <Link
              href="/admin"
              className="font-medium text-black hover:text-[#B92727] transition-colors"
            >
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
                className="flex items-center bg-[#B92727] text-white rounded-xl px-3 lg:px-4 py-2 font-bold gap-2 lg:gap-3"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="flex flex-col items-end min-w-0">
                  <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] lg:max-w-[150px]">
                    {userRole === "admin" && adminProfile?.name
                      ? adminProfile.name
                      : user.displayName || user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs font-normal opacity-85 -mt-1 whitespace-nowrap">
                    {roleName}
                  </span>
                </div>
                <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden flex items-center justify-center bg-white/20 flex-shrink-0">
                  {(userRole === "admin" && adminProfile?.profilePictureUrl) ||
                  user.photoURL ? (
                    <img
                      src={
                        userRole === "admin" && adminProfile?.profilePictureUrl
                          ? adminProfile.profilePictureUrl
                          : user.photoURL || ""
                      }
                      alt={
                        userRole === "admin" && adminProfile?.name
                          ? adminProfile.name
                          : user.displayName || "Profile"
                      }
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error("Error loading profile image");
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget.nextElementSibling;
                        if (nextElement) {
                          nextElement.classList.remove("hidden");
                        }
                      }}
                    />
                  ) : null}
                  <UserCircleDashedIcon
                    className={`w-full h-full text-white ${
                      (userRole === "admin" && adminProfile?.profilePictureUrl) ||
                      user.photoURL
                        ? "hidden"
                        : ""
                    }`}
                  />
                </div>
              </button>
              {profileOpen && (
                <ul className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 px-2 min-w-[180px] z-50">
                  <li>
                    <Link
                      href={
                        userRole === "admin"
                          ? "/admin/profile"
                          : "/responder/profile"
                      }
                      className="block px-4 py-2 text-black hover:text-[#B92727]"
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
