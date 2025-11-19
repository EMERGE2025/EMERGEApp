"use client";

import React from "react";
import { usePathname } from "next/navigation";
import NavBar from "./NavBar";
import BottomNav from "./BottomNav";

/**
 * Renders NavBar on all routes except those that should hide it.
 * Currently hides on /admin/responders (and nested routes under it).
 */
export default function HideableNav() {
  const pathname = usePathname();
  // Hide navigation entirely on routes that render the map module
  const hideOnRoutes: RegExp[] = [
    /^\/admin\/responders(\/.*)?$/,
    /^\/hazards(\/.*)?$/,
  ];

  const shouldHide = hideOnRoutes.some((re) => re.test(pathname || ""));
  if (shouldHide) return null;
  return (
    <>
      <NavBar />
      <BottomNav />
    </>
  );
}
