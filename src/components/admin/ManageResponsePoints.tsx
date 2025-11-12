"use client";

import { useState } from "react";
import {
  User,
  MapPin,
  Plus,
  X,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";

// --- Placeholder Data (with more details) ---
const DUMMY_POINTS = [
  { id: "point1", name: "Iloilo City Station 1", assignedCount: 2 },
  { id: "point2", name: "Molo Fire Substation", assignedCount: 0 },
  { id: "point3", name: "Jaro District Station", assignedCount: 1 },
];

const DUMMY_RESPONDERS = [
  {
    id: "uid-a",
    name: "Mauricio M. Bergancia",
    email: "mauricio@example.com",
    assigned: true,
  },
  {
    id: "uid-b",
    name: "Michael Rey Tuando",
    email: "michael@example.com",
    assigned: true,
  },
  {
    id: "uid-c",
    name: "Mherlie Joy Chavez",
    email: "mherlie@example.com",
    assigned: false,
  },
  {
    id: "uid-d",
    name: "Gillie Calanuga",
    email: "gillie@example.com",
    assigned: false,
  },
];
// --- End Placeholder Data ---

type Point = { id: string; name: string; assignedCount: number };
type Responder = { id: string; name: string; email: string; assigned: boolean };

// --- NEW: Responder Card Component ---
function ResponderListCard({
  user,
  action,
}: {
  user: Responder;
  action: "add" | "remove";
}) {
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
          <User size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      {action === "remove" ? (
        <button className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100">
          <X size={16} weight="bold" />
        </button>
      ) : (
        <button className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-100">
          <Plus size={16} weight="bold" />
        </button>
      )}
    </div>
  );
}

export default function ManageResponsePoints() {
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(
    DUMMY_POINTS[0]
  );
  const [responders, setResponders] = useState(DUMMY_RESPONDERS);
  const [searchTerm, setSearchTerm] = useState("");

  const assigned = responders.filter((r) => r.assigned);
  const available = responders.filter(
    (r) =>
      !r.assigned && r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1: List of Points */}
      <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Response Points
        </h2>
        <div className="space-y-2">
          {DUMMY_POINTS.map((point) => (
            <button
              key={point.id}
              onClick={() => setSelectedPoint(point)}
              className={`w-full flex items-center justify-between p-3 rounded-md text-left transition-colors ${
                selectedPoint?.id === point.id
                  ? "bg-red-50 text-red-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <MapPin size={20} className="mr-3" />
                <span className="font-medium">{point.name}</span>
              </div>
              {/* --- NEW: Responder Count Pill --- */}
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  point.assignedCount > 0
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {point.assignedCount}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Column 2: Management Panel */}
      <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md">
        {!selectedPoint ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Please select a response point to manage.
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Manage: {selectedPoint.name}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assigned Responders */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Assigned Responders ({assigned.length})
                </h3>
                <div className="space-y-3">
                  {assigned.map((user) => (
                    <ResponderListCard
                      key={user.id}
                      user={user}
                      action="remove"
                    />
                  ))}
                  {assigned.length === 0 && (
                    <div className="text-sm text-center text-gray-400 p-4">
                      No responders assigned.
                    </div>
                  )}
                </div>
              </div>

              {/* Available Responders */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Available Responders ({available.length})
                </h3>

                {/* --- NEW: Search Bar --- */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="Search available..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <MagnifyingGlass
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                </div>
                {/* --- End Search Bar --- */}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {available.map((user) => (
                    <ResponderListCard key={user.id} user={user} action="add" />
                  ))}
                  {available.length === 0 && (
                    <div className="text-sm text-center text-gray-400 p-4">
                      No available responders found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
