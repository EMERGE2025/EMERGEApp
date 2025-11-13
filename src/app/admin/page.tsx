"use client";

import { useState } from "react";
import RegisterResponder from "@/components/admin/RegisterResponder";
import ManageResponsePoints from "@/components/admin/ManageResponsePoints";
import {
  MapPin,
  Users,
  WarningCircle,
  ArrowSquareOut,
  UploadIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type AdminTab = "register" | "manage";

// A simple stat card component
function StatCard({
  title,
  value,
  icon,
  color = "bg-red-600",
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="bg-white shadow rounded-lg p-4 md:p-5">
      <div className="flex items-center">
        <div
          className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-md text-white ${color}`}
        >
          {icon}
        </div>
        <div className="ml-3 md:ml-5 w-0 flex-1">
          <dl>
            <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-xl md:text-2xl font-bold text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("register");
  const [selectedRisk, setSelectedRisk] = useState("flooding");

  const tabClass = (tab: AdminTab) =>
    `px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors ${
      activeTab === tab
        ? "bg-red-600 text-white"
        : "text-gray-200 text-gray-700 hover:bg-gray-300"
    }`;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-6 md:mb-8">
          <StatCard
            title="Total Response Points"
            value="3"
            icon={<MapPin size={20} className="md:w-6 md:h-6" />}
          />
          <StatCard
            title="Total Registered Responders"
            value="4"
            icon={<Users size={20} className="md:w-6 md:h-6" />}
          />
          <StatCard
            title="Points Unassigned"
            value="0"
            icon={<WarningCircle size={20} className="md:w-6 md:h-6" />}
            color="bg-amber-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
          <button
            onClick={() => setActiveTab("register")}
            className={tabClass("register")}
          >
            Register Responder
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={tabClass("manage")}
          >
            Manage Assignments
          </button>
          <Link
            href="/admin/responders"
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-300 flex items-center gap-2"
          >
            <span className="hidden sm:inline">View on</span> Map
            <ArrowSquareOut size={16} className="md:w-[18px] md:h-[18px]" />
          </Link>
          <Link
            href="/admin/update"
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-300 flex items-center gap-2"
          >
            Update Data
            <UploadIcon size={16} className="md:w-[18px] md:h-[18px]" />
          </Link>
        </div>

        {activeTab === "manage" && (
          <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <label className="text-xs md:text-sm font-medium text-gray-700">
              Select Hazard:
            </label>
            <div className="flex gap-2 flex-wrap">
              {["flooding", "earthquake", "landslide"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium rounded-md transition-colors capitalize ${
                    selectedRisk === risk
                      ? "bg-red-600 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {activeTab === "register" && <RegisterResponder />}
          {activeTab === "manage" && (
            <ManageResponsePoints
              uniqueID="PH063043000"
              selectedRisk={selectedRisk}
            />
          )}
        </div>
      </div>
    </div>
  );
}
