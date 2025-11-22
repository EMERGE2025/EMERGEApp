"use client";

import { useState, useEffect } from "react";
import {
  User,
  MapPin,
  Plus,
  X,
  MagnifyingGlass,
  CircleNotch,
} from "@phosphor-icons/react/dist/ssr";
import { db } from "@/utils/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

type Point = {
  id: string;
  key: string; // The numeric key like "0", "1", "2"
  name: string;
  assignedCount: number;
  assignedUIDs: string[];
};

type Responder = {
  id: string;
  name: string;
  email: string;
  role: string;
  profilePictureUrl?: string; // Profile picture URL
};

// --- NEW: Responder Card Component ---
function ResponderListCard({
  user,
  action,
  onClick,
}: {
  user: Responder;
  action: "add" | "remove";
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3">
        {/* Profile picture or placeholder avatar */}
        {user.profilePictureUrl ? (
          <img
            src={user.profilePictureUrl}
            alt={user.name}
            className="w-10 h-10 bg-gray-200 rounded-full object-cover"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = "none";
              e.currentTarget.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 ${
            user.profilePictureUrl ? "hidden" : ""
          }`}
        >
          <User size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      {action === "remove" ? (
        <button
          onClick={onClick}
          className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
        >
          <X size={16} weight="bold" />
        </button>
      ) : (
        <button
          onClick={onClick}
          className="text-green-600 hover:text-green-700 p-1 rounded-full hover:bg-green-100"
        >
          <Plus size={16} weight="bold" />
        </button>
      )}
    </div>
  );
}

export default function ManageResponsePoints({
  selectedRisk = "flooding",
}: {
  selectedRisk?: string;
}) {
  const { locationID } = useAuth();
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [allPoints, setAllPoints] = useState<Point[]>([]);
  const [allResponders, setAllResponders] = useState<Responder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allAssignedUIDs, setAllAssignedUIDs] = useState<string[]>([]);

  // Fetch all response points from responder${risk} document
  useEffect(() => {
    if (!locationID) return;

    const documentId = `responder${selectedRisk}`;
    const pointRef = doc(db, locationID, documentId);

    const unsubscribe = onSnapshot(pointRef, (docSnap) => {
      if (docSnap.exists()) {
        const docData = docSnap.data();
        const points: Point[] = [];
        const globalAssignedUIDs: string[] = []; // Collect all assigned UIDs across all points

        // Iterate through all keys in the document
        Object.entries(docData).forEach(([key, value]: [string, any]) => {
          if (value.type === "Feature" && value.properties) {
            const assignedUIDs = value.properties.assignedResponders || [];
            points.push({
              id: `${documentId}_${key}`,
              key: key,
              name: value.properties.name || `Point ${key}`,
              assignedCount: assignedUIDs.length,
              assignedUIDs: assignedUIDs,
            });

            // Add all assigned UIDs to the global list
            globalAssignedUIDs.push(...assignedUIDs);
          }
        });

        setAllPoints(points);
        setAllAssignedUIDs(globalAssignedUIDs); // Store all assigned UIDs
        if (points.length > 0 && !selectedPoint) {
          setSelectedPoint(points[0]);
        }
      }
    });

    return () => unsubscribe();
  }, [locationID, selectedRisk]);

  // Fetch all responders from the 'responders' document inside the locationID collection
  useEffect(() => {
    console.log(
      `🔍 [ManageResponsePoints] Fetching responders for locationID: ${locationID}`
    );

    // Fetch from: locationID/responders document (e.g., PH063043000/responders)
    const respondersDocRef = doc(db, locationID, "responders");

    const unsubscribe = onSnapshot(
      respondersDocRef,
      (docSnap) => {
        console.log(
          `📡 [ManageResponsePoints] Snapshot received for ${locationID}/responders`
        );

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log(`📦 [ManageResponsePoints] Document data:`, data);

          // Get the responderList array
          const responderList = data?.responderList || [];
          console.log(
            `👥 [ManageResponsePoints] Responder list:`,
            responderList
          );

          // Map the responderList to Responder objects
          const responders: Responder[] = responderList.map((r: any) => ({
            id: r.uid, // Use uid as the id
            name: r.name,
            email: r.email,
            role: r.role,
            profilePictureUrl: r.profilePictureUrl, // Include profile picture
          }));

          setAllResponders(responders);
          console.log(
            `✅ [ManageResponsePoints] Set ${responders.length} responders:`,
            responders
          );
        } else {
          console.warn(
            `⚠️ [ManageResponsePoints] No document found at ${locationID}/responders`
          );
          setAllResponders([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error(
          "❌ [ManageResponsePoints] Error fetching responders:",
          error
        );
        setAllResponders([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [locationID]);

  // Handle add/remove actions
  const handleAction = async (
    responderId: string,
    action: "add" | "remove"
  ) => {
    if (!selectedPoint) return;

    const documentId = `responder${selectedRisk}`;
    const pointRef = doc(db, locationID, documentId);
    const fieldPath = `${selectedPoint.key}.properties.assignedResponders`;

    try {
      if (action === "add") {
        await updateDoc(pointRef, {
          [fieldPath]: arrayUnion(responderId),
        });
      } else {
        await updateDoc(pointRef, {
          [fieldPath]: arrayRemove(responderId),
        });
      }
    } catch (error) {
      console.error("Error updating responder assignment:", error);
    }
  };

  // Handle reset all - remove all assigned responders from selected point
  const handleResetAll = async () => {
    if (!selectedPoint || !locationID) return;

    const documentId = `responder${selectedRisk}`;
    const pointRef = doc(db, locationID, documentId);
    const fieldPath = `${selectedPoint.key}.properties.assignedResponders`;

    try {
      await updateDoc(pointRef, {
        [fieldPath]: [],
      });
    } catch (error) {
      console.error("Error resetting responder assignments:", error);
    }
  };

  // Filter responders into assigned and available
  // Assigned: responders assigned to THIS specific point
  const assigned = allResponders.filter((r) =>
    selectedPoint?.assignedUIDs.includes(r.id)
  );

  // Available: responders NOT assigned to ANY point (checking global assignments)
  const available = allResponders.filter(
    (r) =>
      !allAssignedUIDs.includes(r.id) && // Not assigned to ANY point
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <CircleNotch size={32} className="animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Column 1: List of Points */}
      <div className="md:col-span-1 bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Response Points ({selectedRisk})
        </h2>
        <div className="space-y-2">
          {allPoints.map((point) => (
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
              {/* --- Responder Count Pill --- */}
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
          {allPoints.length === 0 && (
            <div className="text-sm text-center text-gray-400 p-4">
              No response points found.
            </div>
          )}
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
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
              {/* Assigned Responders */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-700">
                    Assigned Responders ({assigned.length})
                  </h3>
                  {assigned.length > 0 && (
                    <button
                      onClick={handleResetAll}
                      className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 font-medium"
                    >
                      Reset All
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {assigned.map((user) => (
                    <ResponderListCard
                      key={user.id}
                      user={user}
                      action="remove"
                      onClick={() => handleAction(user.id, "remove")}
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
              {/* <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Available Responders ({available.length})
                </h3> */}

              {/* --- Search Bar --- */}
              {/* <div className="relative mb-3">
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
                </div> */}
              {/* --- End Search Bar --- */}

              {/* <div className="space-y-3 max-h-96 overflow-y-auto">
                  {available.map((user) => (
                    <ResponderListCard
                      key={user.id}
                      user={user}
                      action="add"
                      onClick={() => handleAction(user.id, "add")}
                    />
                  ))}
                  {available.length === 0 && (
                    <div className="text-sm text-center text-gray-400 p-4">
                      No available responders found.
                    </div>
                  )}
                </div> */}
              {/* </div> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
