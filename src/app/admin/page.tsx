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
    <div className="bg-white shadow rounded-lg p-5">
      <div className="flex items-center">
        <div
          className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-md text-white ${color}`}
        >
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="text-2xl font-bold text-gray-900">{value}</dd>
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
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === tab
        ? "bg-red-600 text-white"
        : "text-gray-200 text-gray-700 hover:bg-gray-300"
    }`;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Admin Dashboard
        </h1>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <StatCard
            title="Total Response Points"
            value="3" // This will come from Firebase
            icon={<MapPin size={24} />}
          />
          <StatCard
            title="Total Registered Responders"
            value="4" // This will come from Firebase
            icon={<Users size={24} />}
          />
          <StatCard
            title="Points Unassigned"
            value="0" // This will come from Firebase
            icon={<WarningCircle size={24} />}
            color="bg-amber-500"
          />
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab("register")}
            className={tabClass("register")}
          >
            Register New Responder
          </button>
          <button
            onClick={() => setActiveTab("manage")}
            className={tabClass("manage")}
          >
            Manage Assignments
          </button>
          <Link
            href="/admin/responders"
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-300 flex items-center gap-2"
          >
            View on Map
            <ArrowSquareOut size={18} />
          </Link>
          <Link
            href="/admin/update"
            className="px-4 py-2 text-sm font-medium rounded-md transition-colors text-gray-700 hover:bg-gray-300 flex items-center gap-2"
          >
            Update Data
            <UploadIcon size={18} />
          </Link>
        </div>

        {/* Hazard Selector (only show when on manage tab) */}
        {activeTab === "manage" && (
          <div className="mb-6 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">
              Select Hazard:
            </label>
            <div className="flex gap-2">
              {["flooding", "earthquake", "landslide"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
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
