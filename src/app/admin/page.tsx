"use client";

import { useState, useEffect } from "react";
import { db } from "@/utils/firebase";
import { doc, getDoc } from "firebase/firestore";
import RegisterResponder from "@/components/admin/RegisterResponder";
import ManageResponsePoints from "@/components/admin/ManageResponsePoints";
import {
  MapPin,
  Users,
  WarningCircle,
  ArrowSquareOut,
  UploadIcon,
  TrendUp,
  ActivityIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type AdminTab = "register" | "manage";

interface DashboardStats {
  totalResponsePoints: number;
  totalResponders: number;
  unassignedPoints: number;
  activeHazards: number;
  loading: boolean;
}

// Enhanced stat card component with loading animation
function StatCard({
  title,
  value,
  icon,
  color = "bg-red-600",
  trend,
  loading = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
}) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-5 md:p-6 hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg text-white ${color} shadow-md`}
            >
              {icon}
            </div>
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-wide">
                {title}
              </p>
              {loading ? (
                <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                  {value}
                </p>
              )}
            </div>
          </div>
          {trend && !loading && (
            <div className="flex items-center gap-1 text-xs">
              <TrendUp
                size={14}
                className={
                  trend.isPositive
                    ? "text-green-500"
                    : "text-red-500 rotate-180"
                }
              />
              <span
                className={trend.isPositive ? "text-green-600" : "text-red-600"}
              >
                {trend.value}%
              </span>
              <span className="text-gray-500">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>("manage");
  const [selectedRisk, setSelectedRisk] = useState("flooding");
  const [stats, setStats] = useState<DashboardStats>({
    totalResponsePoints: 0,
    totalResponders: 0,
    unassignedPoints: 0,
    activeHazards: 0,
    loading: true,
  });

  // Fetch real-time statistics from Firestore
  useEffect(() => {
    async function fetchStats() {
      try {
        setStats((prev) => ({ ...prev, loading: true }));

        const uniqueID = "PH063043000"; // Your location ID
        const risks = ["flooding", "earthquake", "landslide"];

        // Fetch response points from {uniqueID}/responder${risk} documents
        let totalResponsePoints = 0;
        let unassignedPoints = 0;

        for (const risk of risks) {
          try {
            const responderDocRef = doc(db, uniqueID, `responder${risk}`);
            const responderDoc = await getDoc(responderDocRef);

            if (responderDoc.exists()) {
              const docData = responderDoc.data();

              // Iterate through all numbered keys in the document
              Object.entries(docData).forEach(([key, value]: [string, any]) => {
                if (value.type === "Feature" && value.properties) {
                  totalResponsePoints++;

                  // Check if point has assigned responders
                  const assignedResponders = value.properties.assignedResponders || [];
                  if (assignedResponders.length === 0) {
                    unassignedPoints++;
                  }
                }
              });
            }
          } catch (error) {
            console.error(`Error fetching ${uniqueID}/responder${risk}:`, error);
          }
        }

        // Fetch responders from {uniqueID}/responders document
        let totalResponders = 0;
        try {
          const respondersDocRef = doc(db, uniqueID, "responders");
          const respondersDoc = await getDoc(respondersDocRef);

          if (respondersDoc.exists()) {
            const data = respondersDoc.data();
            const responderList = data?.responderList || [];
            totalResponders = responderList.length;
          }
        } catch (error) {
          console.error(`Error fetching ${uniqueID}/responders:`, error);
        }

        // Count active hazards from {uniqueID}/${risk} documents
        let activeHazards = 0;
        for (const risk of risks) {
          try {
            const hazardDocRef = doc(db, uniqueID, risk);
            const hazardDoc = await getDoc(hazardDocRef);

            if (hazardDoc.exists()) {
              const docData = hazardDoc.data();
              // Count the number of feature keys in the document
              const featureCount = Object.keys(docData).filter(key =>
                docData[key]?.type === "Feature"
              ).length;
              activeHazards += featureCount;
            }
          } catch (error) {
            console.error(`Error fetching ${uniqueID}/${risk}:`, error);
          }
        }

        setStats({
          totalResponsePoints,
          totalResponders,
          unassignedPoints,
          activeHazards,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }

    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabClass = (tab: AdminTab) =>
    `px-4 md:px-5 py-2.5 text-sm md:text-base font-semibold rounded-lg transition-all duration-200 ${
      activeTab === tab
        ? "bg-red-600 text-white shadow-md"
        : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
    }`;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm md:text-base text-gray-600 flex items-center gap-2">
            <ActivityIcon size={18} weight="duotone" />
            Real-time emergency response management
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
          <StatCard
            title="Response Points"
            value={stats.totalResponsePoints}
            icon={<MapPin size={24} weight="duotone" />}
            color="bg-blue-600"
            trend={{ value: 12, isPositive: true }}
            loading={stats.loading}
          />
          <StatCard
            title="Registered Responders"
            value={stats.totalResponders}
            icon={<Users size={24} weight="duotone" />}
            color="bg-green-600"
            trend={{ value: 8, isPositive: true }}
            loading={stats.loading}
          />
          <StatCard
            title="Unassigned Points"
            value={stats.unassignedPoints}
            icon={<WarningCircle size={24} weight="duotone" />}
            color="bg-amber-500"
            loading={stats.loading}
          />
          <StatCard
            title="Active Hazards"
            value={stats.activeHazards}
            icon={<ActivityIcon size={24} weight="duotone" />}
            color="bg-red-600"
            loading={stats.loading}
          />
        </div>

        {/* Quick Actions & Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab("manage")}
              className={tabClass("manage")}
            >
              Manage Assignments
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={tabClass("register")}
            >
              Register Responder
            </button>
            <Link
              href="/admin/responders"
              className="px-4 md:px-5 py-2.5 text-sm md:text-base font-semibold rounded-lg transition-all duration-200 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2"
            >
              <MapPin size={18} weight="duotone" />
              View on Map
              <ArrowSquareOut size={16} />
            </Link>
            <Link
              href="/admin/update"
              className="px-4 md:px-5 py-2.5 text-sm md:text-base font-semibold rounded-lg transition-all duration-200 text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center gap-2"
            >
              <UploadIcon size={18} weight="duotone" />
              Update Data
            </Link>
          </div>
        </div>

        {/* Hazard Type Selector (for manage tab) */}
        {activeTab === "manage" && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <label className="text-sm md:text-base font-semibold text-gray-900 block mb-3">
              Select Hazard Type:
            </label>
            <div className="flex gap-2 flex-wrap">
              {["flooding", "earthquake", "landslide"].map((risk) => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={`px-4 md:px-5 py-2.5 text-sm md:text-base font-semibold rounded-lg transition-all duration-200 capitalize ${
                    selectedRisk === risk
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
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
