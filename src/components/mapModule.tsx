"use client";

import React, { useEffect, useRef, useState, Fragment, useCallback } from "react";
import maplibregl, { Popup, Marker } from "maplibre-gl";
// @ts-ignore: side-effect CSS import without type declarations
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { Menu, Transition, Dialog } from "@headlessui/react";
import SettingsSidebar from "./SettingsSidebar";
import {
  MagnifyingGlassIcon,
  ArrowLeft,
  X,
  Flame,
  Eye,
  EyeSlash,
  Info,
  Globe,
  Plus,
  Minus,
  List,
  Signpost,
  Crosshair,
  MapPin,
  Car,
  User,
  CircleNotch, // FIX: Replaced Spinner with CircleNotch
  UserCircleDashed,
  CaretRight,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr";
import { Timer } from "@phosphor-icons/react";

// --- NEW: FIREBASE IMPORTS ---
import { db } from "@/utils/firebase"; // Use your correct path
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  query,
  where,
  onSnapshot,
  GeoPoint,
  writeBatch,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";

// --- Types ---
export type MarkerData = {
  id: number;
  lat: number;
  lng: number;
  type: string;
  title?: string;
  riskScore?: number;
  cluster?: number;
};
interface ClusterFeature extends maplibregl.MapGeoJSONFeature {
  properties: {
    cluster: boolean;
    cluster_id: number;
    point_count: number;
    [key: string]: any;
  };
}
export type iconType = "earthquake" | "landslide" | "flood" | "responder";
export type mapType = "liberty" | "positron" | "bright";
type GJ = GeoJSON.FeatureCollection | GeoJSON.Feature | string;
interface BoundaryEntry {
  id: "boundary";
  boundary: GJ;
}
interface HazardEntry {
  id: string; // e.g., "flooding", "responderflooding", "all_risks"
  risk?: GJ; // Risk is optional
  responderRange?: GJ;
  responderLocation?: any; // FIX: This is a map/object, not GeoJSON
}
type Person = {
  id: string; // This is the Auth UID
  name: string;
  email: string;
  role: "responder" | "admin" | "user";
  profilePictureUrl?: string; // Profile picture URL
  skills?: {
    hard?: string[]; // Array of hard skills
    soft?: string[]; // Array of soft skills
  };
  personality?: string; // Personality type or description
};
// This type is no longer used
type ResponsePoint = {
  id: string;
  name: string;
  location: GeoPoint;
  assignedResponders: string[];
};
// --- End Types ---

/**
 * --- COMPLETELY REWRITTEN RESPONDER SIDEBAR ---
 * This component is now data-driven by Firebase.
 */
function ResponderSidebar({
  isOpen,
  onClose,
  mode,
  pointDocId, // This is the key (e.g., "0", "1")
  pointName, // This is the human-readable name
  allResponders,
  uniqueID, // This is the collection ID (e.g., PH063043000)
  selectedRisk, // This is the current risk (e.g., "flooding")
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: "user" | "admin" | "responder";
  pointDocId: string | null;
  pointName: string;
  allResponders: Person[];
  uniqueID: string;
  selectedRisk: string; // Added prop
}) {
  const [loading, setLoading] = useState(false);
  const [assigned, setAssigned] = useState<Person[]>([]);
  const [available, setAvailable] = useState<Person[]>([]);

  useEffect(() => {
    if (!pointDocId || !isOpen || !uniqueID || !selectedRisk) {
      console.log(
        `⏭️ [ResponderSidebar] Skipping - pointDocId: ${pointDocId}, isOpen: ${isOpen}, uniqueID: ${uniqueID}, selectedRisk: ${selectedRisk}`
      );
      return;
    }

    console.log(
      `🔍 [ResponderSidebar] Loading assignments for point: ${pointDocId}`
    );
    console.log(
      `👥 [ResponderSidebar] Total responders available: ${allResponders.length}`,
      allResponders
    );

    setLoading(true);

    // --- UPDATED: Read from responder${risk} document instead of "responders" ---
    const collectionId = uniqueID;
    const documentId = `responder${selectedRisk}`; // e.g., "responderflooding"
    const pointRef = doc(db, collectionId, documentId);

    // Use onSnapshot to listen for real-time updates
    const unsubscribe = onSnapshot(pointRef, (docSnap) => {
      const newAssigned: Person[] = [];
      const newAvailable: Person[] = [];

      if (docSnap.exists()) {
        const docData = docSnap.data();
        console.log(
          `📦 [ResponderSidebar] Document data for ${documentId}:`,
          docData
        );

        // Get the feature object for this specific point (e.g., docData["0"])
        const pointFeature = docData?.[pointDocId];
        console.log(
          `📍 [ResponderSidebar] Point feature for ${pointDocId}:`,
          pointFeature
        );

        // --- NEW: Collect ALL assigned UIDs across ALL points ---
        const globalAssignedUIDs: string[] = [];
        Object.entries(docData).forEach(([key, value]: [string, any]) => {
          if (
            value.type === "Feature" &&
            value.properties?.assignedResponders
          ) {
            globalAssignedUIDs.push(...value.properties.assignedResponders);
          }
        });
        console.log(
          `🌍 [ResponderSidebar] Global assigned UIDs:`,
          globalAssignedUIDs
        );

        if (pointFeature && pointFeature.properties) {
          // Get the array of UIDs from properties.assignedResponders for THIS point
          const assignedUIDs = pointFeature.properties.assignedResponders || [];
          console.log(
            `✅ [ResponderSidebar] Assigned UIDs for this point:`,
            assignedUIDs
          );

          // Filter all responders into Assigned or Available lists
          for (const responder of allResponders) {
            if (assignedUIDs.includes(responder.id)) {
              // This responder is assigned to THIS point
              newAssigned.push(responder);
            } else if (!globalAssignedUIDs.includes(responder.id)) {
              // This responder is NOT assigned to ANY point - available
              newAvailable.push(responder);
            }
            // If assigned to another point, don't show in available
          }

          console.log(
            `👥 [ResponderSidebar] Assigned responders (${newAssigned.length}):`,
            newAssigned
          );
          console.log(
            `📋 [ResponderSidebar] Available responders (${newAvailable.length}):`,
            newAvailable
          );
        } else {
          // Point feature doesn't have properties yet
          console.warn(
            `⚠️ [ResponderSidebar] Point ${pointDocId} has no properties in ${documentId}`
          );
          // Show only responders not assigned to ANY point
          for (const responder of allResponders) {
            if (!globalAssignedUIDs.includes(responder.id)) {
              newAvailable.push(responder);
            }
          }
        }
      } else {
        // Document doesn't exist yet
        console.warn(
          `❌ [ResponderSidebar] Document not found: ${collectionId}/${documentId}`
        );
        // Show all responders as available
        newAvailable.push(...allResponders);
      }

      setAssigned(newAssigned);
      setAvailable(newAvailable);
      setLoading(false);
    });

    // Detach listener on cleanup
    return () => unsubscribe();
  }, [pointDocId, allResponders, isOpen, uniqueID, selectedRisk]);

  const handleAction = async (personId: string, action: "add" | "remove") => {
    if (mode !== "admin" || !pointDocId || !uniqueID || !selectedRisk) return;

    // --- UPDATED: Write to responder${risk} document's properties field ---
    const collectionId = uniqueID;
    const documentId = `responder${selectedRisk}`; // e.g., "responderflooding"
    const pointRef = doc(db, collectionId, documentId);

    // Use the pointDocId (key "0", "1", etc.) to access the feature
    // We need to update the nested path: pointDocId.properties.assignedResponders
    const fieldPath = `${pointDocId}.properties.assignedResponders`;

    try {
      if (action === "add") {
        await updateDoc(pointRef, {
          [fieldPath]: arrayUnion(personId),
        });
      } else {
        await updateDoc(pointRef, {
          [fieldPath]: arrayRemove(personId),
        });
      }
    } catch (error) {
      // If the document doesn't exist or the field isn't there, create it
      if (
        (error as any).code === "not-found" ||
        (error as any).code === "invalid-argument"
      ) {
        try {
          // Create the document and/or field
          await setDoc(
            pointRef,
            {
              [pointDocId]: {
                properties: {
                  assignedResponders: arrayUnion(personId),
                },
              },
            },
            { merge: true }
          ); // Use merge to preserve existing data
        } catch (e2) {
          console.error("Failed to create doc and update responders:", e2);
        }
      } else {
        console.error("Failed to update responders:", error);
      }
    }
  };

  /**
   * Re-usable chip component.
   */
  const ResponderChipRow = ({
    list,
    modeAction,
  }: {
    list: Person[];
    modeAction: "remove" | "add" | "user"; // "user" mode is read-only
  }) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
      <div className="flex flex-col gap-2">
        {list.map((p) => (
          <div key={p.id} className="flex flex-col gap-2">
            <div
              className="pr-1 bg-zinc-900/10 rounded-lg flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-zinc-900/15 transition-colors"
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
            >
              {/* Profile picture or placeholder avatar */}
              {p.profilePictureUrl ? (
                <img
                  src={p.profilePictureUrl}
                  alt={p.name}
                  className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  onError={(e: any) => {
                    // Fallback to placeholder if image fails to load
                    (e.target as HTMLImageElement).style.display = "none";
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0 ${
                  p.profilePictureUrl ? "hidden" : ""
                }`}
              >
                <User size={14} color="white" />
              </div>
              <div className="flex-1 flex items-center justify-between gap-2">
                <div className="opacity-90 text-[13px] font-medium text-[#111827]">{p.name}</div>
                <div className="flex items-center gap-1">
                  {/* Expand/Collapse indicator */}
                  {expandedId === p.id ? (
                    <CaretDown size={12} color="#a1a5ab" weight="bold" />
                  ) : (
                    <CaretRight size={12} color="#a1a5ab" weight="bold" />
                  )}
                  {/* Only show button if admin */}
                  {mode === "admin" && (
                    <button
                      onClick={(e: any) => {
                        e.stopPropagation();
                        handleAction(p.id, modeAction as "add" | "remove");
                      }}
                      className="w-[24px] h-[24px] min-w-[24px] min-h-[24px] max-w-[24px] max-h-[24px] inline-flex items-center justify-center rounded-full text-[14px] font-medium leading-none border border-gray-400 text-gray-600 hover:bg-red-600 hover:text-white hover:border-red-600 transition flex-shrink-0"
                    >
                      {modeAction === "remove" ? "×" : "+"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {expandedId === p.id && (
              <div className="ml-9 mr-2 p-3 bg-white rounded-lg border border-zinc-200 space-y-2.5">
                {/* Personality */}
                {p.personality && (
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">
                      Personality
                    </div>
                    <div className="text-[12px] text-zinc-800 font-medium">
                      {p.personality}
                    </div>
                  </div>
                )}

                {/* Hard Skills */}
                {p.skills?.hard && p.skills.hard.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Hard Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.hard.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Soft Skills */}
                {p.skills?.soft && p.skills.soft.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1.5">
                      Soft Skills
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {p.skills.soft.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-medium rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show message if no data */}
                {!p.personality &&
                  (!p.skills?.hard || p.skills.hard.length === 0) &&
                  (!p.skills?.soft || p.skills.soft.length === 0) && (
                    <div className="text-[11px] text-zinc-400 italic text-center py-2">
                      No additional information available
                    </div>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[1000]" onClose={onClose}>
        {/* Overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        {/* Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex">
          <Transition.Child
            as={Fragment}
            enter="transform transition ease-in-out duration-300"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <Dialog.Panel className="w-screen max-w-md">
              <div className="relative w-full h-full p-4 bg-[#F7F7F7] shadow-xl flex flex-col gap-2.5">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-5 cursor-pointer w-[22px] h-[22px] rounded-full border-0 outline-none bg-[#f3f4f6] text-[#6b7280] flex items-center justify-center text-[14px]"
                  aria-label="Close"
                >
                  ×
                </button>

                {/* Scrollable content */}
                <div className="overflow-y-auto p-2 rounded-lg flex flex-col gap-2 h-full">
                  {/* Header */}
                  <div className="flex flex-col gap-2">
                    <div className="inline-flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-7 h-7 rounded-full bg-red-600 flex items-center justify-center">
                          <div className="absolute w-[14px] h-[3px] rounded-sm bg-white" />
                          <div className="absolute w-[3px] h-[14px] rounded-sm bg-white" />
                        </div>
                        <div className="text-[#111827] text-[18px] font-bold">Responders</div>
                      </div>
                    </div>
                    <div className="w-full text-[12px] text-zinc-900/60">Deploy and See Available Responders</div>
                  </div>

                  <div className="self-stretch h-px border-t border-neutral-800/20"></div>

                  {/* Recommended */}
                  <div className="text-[12px] text-zinc-700">
                    Recommended: <span className="text-red-600 font-semibold">{assigned.length} Responders</span>
                  </div>
                  
                  <div className="self-stretch h-px border-t border-neutral-800/20"></div>

                  {/* Content Area */}
                  {loading ? (
                    <div className="flex items-center justify-center h-48">
                      <CircleNotch
                        size={32}
                        className="animate-spin text-red-600"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {/* Deploy/Assigned List */}
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-2">
                          <div className="text-red-600 text-[12px] font-semibold">Deploy Responder(s)</div>
                          <div className="w-1 h-1 bg-zinc-900/60 rounded-full"></div>
                          <div className="text-zinc-900/60 text-[12px] font-medium">{assigned.length} Selected</div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-900/10 flex flex-col gap-2 min-h-[7rem] overflow-auto resize">
                          <ResponderChipRow list={assigned} modeAction={mode === "admin" ? "remove" : "user"} />
                        </div>
                      </div>

                      {/* Available List (shown for both modes; actions only in admin) */}
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-2">
                          <div className="text-red-600 text-[12px] font-semibold">Available Responder(s)</div>
                          <div className="w-1 h-1 bg-zinc-900/60 rounded-full"></div>
                          <div className="text-zinc-900/60 text-[12px] font-medium">{available.length} Available</div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-900/10 flex flex-col gap-2 min-h-[7rem] overflow-auto resize">
                          <ResponderChipRow list={available} modeAction={mode === "admin" ? "add" : "user"} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="mt-2 inline-flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-semibold hover:bg-red-700 transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md text-sm font-semibold hover:bg-red-600 hover:text-white transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
// --- END OF NEW RESPONDER COMPONENT ---

export default function MapLibre3D({
  mapType = "liberty",
  selectedRisk,
  riskDatabase,
  searchLocation,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  isSearching,
  onHazardChange,
  userLocation,
  onGetCurrentLocation,
  mode = "user", // --- NEW PROP ---
  uniqueID, // --- NEW PROP ---
}: {
  mapType: mapType;
  selectedRisk: string;
  riskDatabase: HazardEntry[]; // Use specific type
  searchLocation?: { lng: number; lat: number } | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: () => void;
  isSearching: boolean;
  onHazardChange: (hazard: string) => void;
  userLocation: { lng: number; lat: number } | null;
  onGetCurrentLocation: () => void;
  mode?: "user" | "admin" | "responder"; // --- NEW PROP ---
  uniqueID: string; // --- NEW PROP ---
}) {
  // --- AUTH CONTEXT ---
  const { user, userRole } = useAuth();

  // --- ADMIN PROFILE STATE ---
  const [adminProfile, setAdminProfile] = useState<{
    name?: string;
    profilePictureUrl?: string;
  } | null>(null);

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
          setAdminProfile({
            name: data.name,
            profilePictureUrl: data.profilePictureUrl,
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

  // Get role display name
  const getRoleDisplayName = () => {
    if (userRole === "admin") return "Administrator";
    if (userRole === "responder") return "Responder";
    return "User";
  };

  const mapRef = useRef<maplibregl.Map | null>(null);
  const currentPopupRef = useRef<maplibregl.Popup | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [currentHazard, setCurrentHazard] = useState<string>("");
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState<boolean>(false);
  const [areMarkersVisible, setAreMarkersVisible] = useState<boolean>(true);
  const [isLegendVisible, setIsLegendVisible] = useState<boolean>(false);
  const [is3D, setIs3D] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [clustersCount, setClustersCount] = useState<number>(8);
  // Right-side responder panel handled by ResponderSidebar component below

  // --- NEW: Map Loaded State ---
  const [isMapLoaded, setIsMapLoaded] = useState(false); // Fix for race condition

  // --- ROUTING STATE ---
  const [isRoutingPanelOpen, setIsRoutingPanelOpen] = useState(false);
  const [startPoint, setStartPoint] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [endPoint, setEndPoint] = useState<{ lng: number; lat: number } | null>(
    null
  );
  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [selectedTransportMode, setSelectedTransportMode] =
    useState("driving-car");
  const [routeGeoJSON, setRouteGeoJSON] = useState<any | null>(null);
  const [isPickingStart, setIsPickingStart] = useState(false);
  const [pickingMode, setPickingMode] = useState<"start" | "end" | null>(null);
  const pickingModeRef = useRef<"start" | "end" | null>(pickingMode);
  const [isPickingEnd, setIsPickingEnd] = useState(false);
  const [isFetchingRoute, setIsFetchingRoute] = useState(false);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);

  // --- MARKER STATE ---
  const [userLocationMarker, setUserLocationMarker] =
    useState<maplibregl.Marker | null>(null);
  const [startPin, setStartPin] = useState<maplibregl.Marker | null>(null);
  const [endPin, setEndPin] = useState<maplibregl.Marker | null>(null);

  // --- CURRENT LOCATION DISPLAY STATE ---
  const [showLocationCoords, setShowLocationCoords] = useState(false);

  // --- BLOCKAGE STATE ---
  type Blockage = {
    id: string;
    name: string;
    coordinates: string; // Store as JSON string to avoid nested arrays in Firestore
    createdBy: string;
    createdAt: number;
  };
  const [blockages, setBlockages] = useState<Blockage[]>([]);
  const [isDrawingBlockage, setIsDrawingBlockage] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<number[][]>([]);

  // --- UPDATED RESPONDER STATE ---
  const [isResponderSidebarOpen, setIsResponderSidebarOpen] = useState(false);
  const [selectedPointDocId, setSelectedPointDocId] = useState<string | null>(
    null
  ); // This will be the locationid
  const [selectedResponderData, setSelectedResponderData] = useState<
    any | null
  >(null);

  // --- NEW FIREBASE DATA STATE ---
  const [allResponders, setAllResponders] = useState<Person[]>([]);
  // --- REMOVED responsePoints STATE ---

  // ... (helper functions unchanged: formatDuration, calculateETA, enhanceFeaturesWithVulnerability) ...
  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes} min ${seconds} sec`;
  };

  const calculateETA = (totalSeconds: number) => {
    const eta = new Date(Date.now() + totalSeconds * 1000);
    return eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const enhanceFeaturesWithVulnerability = (
    features: any[],
    vulnerabilityData: any
  ) => {
    return features.map((feature: any) => {
      const coords = feature.geometry.coordinates;
      let vulnerabilityScore = 0.5;

      if (vulnerabilityData && vulnerabilityData.vulnerability) {
        const vulnData =
          typeof vulnerabilityData.vulnerability === "string"
            ? JSON.parse(vulnerabilityData.vulnerability)
            : vulnerabilityData.vulnerability;

        if (vulnData && vulnData.features) {
          let closestDistance = Infinity;
          let closestVulnerability = 0.5;
          try {
            vulnData.features.forEach((vulnFeature: any) => {
              const vulnCoords = vulnFeature.geometry.coordinates;
              const distance = Math.sqrt(
                Math.pow(coords[0] - vulnCoords[0], 2) +
                  Math.pow(coords[1] - vulnCoords[1], 2)
              );
              if (distance < closestDistance) {
                closestDistance = distance;
                closestVulnerability =
                  vulnFeature.properties?.vulnerabilityIndex || 0.5;
              }
            });
          } catch (error: any) {
            console.error("Error processing vulnerability features:", error);
          }
          vulnerabilityScore = closestVulnerability;
        }
      }
      const hazardScore = feature.properties?.riskScore || 0.5;
      const combinedRiskScore = hazardScore * vulnerabilityScore;
      return {
        ...feature,
        properties: {
          ...feature.properties,
          vulnerabilityScore: vulnerabilityScore,
          combinedRiskScore: combinedRiskScore,
          originalRiskScore: hazardScore,
        },
      };
    });
  };

  // ... (map control toggles unchanged: toggleHeatmap, toggleMarkers, createHeatmapLayer) ...
  const toggleHeatmap = () => {
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) {
      console.warn("Cannot toggle heatmap: map or data not ready");
      return;
    }
    const map = mapRef.current;
    const hazard = selectedRisk;
    const heatmapLayerId = `${hazard}-heatmap`;

    if (isHeatmapEnabled) {
      if (map.getLayer(heatmapLayerId)) {
        map.setLayoutProperty(heatmapLayerId, "visibility", "none");
      }
      setIsHeatmapEnabled(false);
    } else {
      if (map.getLayer(heatmapLayerId)) {
        map.setLayoutProperty(heatmapLayerId, "visibility", "visible");
      } else {
        createHeatmapLayer(hazard);
      }
      setIsHeatmapEnabled(true);
    }
  };

  const toggleMarkers = () => {
    if (!mapRef.current) {
      console.warn("Cannot toggle markers: map not ready");
      return;
    }
    const map = mapRef.current;
    const hazard = selectedRisk;
    const markerLayers = [
      `${hazard}-risk`,
      "responderLocation",
      "clusters",
      "cluster-count",
    ];

    if (areMarkersVisible) {
      markerLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
      });
      setAreMarkersVisible(false);
    } else {
      markerLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "visible");
        }
      });
      setAreMarkersVisible(true);
    }
  };

  const createHeatmapLayer = (hazard: string) => {
    if (!mapRef.current || !riskDatabase) {
      console.error("Map or risk database not available");
      return;
    }
    const map = mapRef.current;
    const riskData = riskDatabase.find(
      (d: { id: string }) => d.id === hazard
    ) as HazardEntry;
    const vulnerabilityData = riskDatabase.find(
      (d: any) => d.id === "population_vulnerability"
    ) as any;

    if (!riskData || !riskData.risk) {
      console.error(`No risk data found for ${hazard}`);
      return;
    }

    const heatmapLayerId = `${hazard}-heatmap`;
    const heatmapSourceId = `${hazard}-heatmap-source`;

    try {
      const hazardGeoJSON =
        typeof riskData.risk === "string"
          ? JSON.parse(riskData.risk)
          : riskData.risk;

      if (!hazardGeoJSON.features || hazardGeoJSON.features.length === 0) {
        console.error("No hazard features found");
        return;
      }
      const enhancedFeatures = enhanceFeaturesWithVulnerability(
        hazardGeoJSON.features,
        vulnerabilityData
      );
      const enhancedGeoJSON = { ...hazardGeoJSON, features: enhancedFeatures };

      if (map.getLayer(heatmapLayerId)) map.removeLayer(heatmapLayerId);
      if (map.getSource(heatmapSourceId)) map.removeSource(heatmapSourceId);

      map.addSource(heatmapSourceId, {
        type: "geojson",
        data: enhancedGeoJSON,
      });

      const layers = map.getStyle().layers || [];
      let insertBeforeLayer = undefined;
      for (const layer of layers) {
        if (layer.type === "symbol" && layer.id.includes("-risk")) {
          insertBeforeLayer = layer.id;
          break;
        }
      }
      if (!insertBeforeLayer) {
        const boundaryLayer = layers.find((layer) => layer.id === "boundary");
        insertBeforeLayer = boundaryLayer ? boundaryLayer.id : undefined;
      }

      map.addLayer(
        {
          id: heatmapLayerId,
          type: "heatmap",
          source: heatmapSourceId,
          maxzoom: 18,
          paint: {
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "combinedRiskScore"],
              0,
              0,
              1,
              1,
            ],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              0.5,
              10,
              1,
              15,
              2,
              18,
              3,
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(34,197,94,0)",
              0.1,
              "rgba(34,197,94,0.4)",
              0.2,
              "rgba(34,197,94,0.6)",
              0.3,
              "rgba(251,191,36,0.6)",
              0.4,
              "rgba(251,191,36,0.7)",
              0.5,
              "rgba(245,158,11,0.8)",
              0.6,
              "rgba(239,68,68,0.8)",
              0.7,
              "rgba(220,38,38,0.9)",
              0.8,
              "rgba(185,28,28,0.9)",
              0.9,
              "rgba(153,27,27,0.95)",
              1,
              "rgba(127,29,29,1)",
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8,
              12,
              12,
              25,
              15,
              35,
              18,
              55,
            ],
            "heatmap-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              8,
              0.7,
              12,
              0.9,
              18,
              0.8,
            ],
          },
        },
        insertBeforeLayer
      );
    } catch (error) {
      console.error(
        `❌ Error creating enhanced vulnerability heatmap for ${hazard}:`,
        error
      );
    }
  };

  // ... (routing functions: fetchRoute, handleGetRoute, clearRoute, createDraggablePin) ...
  const fetchRoute = async (
    start: { lng: number; lat: number },
    end: { lng: number; lat: number },
    mode: string
  ) => {
    setIsFetchingRoute(true);
    setRouteGeoJSON(null);
    setRouteDuration(null);
    const url = "/api/route";

    // Convert blockages to avoid_polygons format for OpenRouteService
    // OpenRouteService expects a GeoJSON Polygon or MultiPolygon
    let avoidPolygons = undefined;
    if (blockages.length > 0) {
      console.log("Processing blockages for routing:", blockages);

      if (blockages.length === 1) {
        // Single polygon
        const coords = JSON.parse(blockages[0].coordinates);
        avoidPolygons = {
          type: "Polygon" as const,
          coordinates: coords,
        };
      } else {
        // Multiple polygons - use MultiPolygon
        avoidPolygons = {
          type: "MultiPolygon" as const,
          coordinates: blockages.map((b) => JSON.parse(b.coordinates)),
        };
      }

      console.log(
        "Avoid polygons for routing:",
        JSON.stringify(avoidPolygons, null, 2)
      );
    }

    const body = JSON.stringify({
      start,
      end,
      mode,
      avoid_polygons: avoidPolygons,
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch route");
      }
      setRouteGeoJSON(data);
      if (data.features && data.features[0]?.properties?.summary?.duration) {
        setRouteDuration(data.features[0].properties.summary.duration);
      } else {
        setRouteDuration(null);
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      alert(
        `Error fetching route: ${
          (error as Error).message
        }. Check console for details.`
      );
    } finally {
      setIsFetchingRoute(false);
    }
  };

  const handleGetRoute = () => {
    let start = startPoint;
    if (!start) {
      if (userLocation) {
        start = userLocation;
        setStartPoint(userLocation);
        setStartAddress("My Location");
      } else {
        alert("Please set a start point.");
        onGetCurrentLocation();
        return;
      }
    }
    if (!endPoint) {
      alert("Please set an end point.");
      return;
    }
    fetchRoute(start, endPoint, selectedTransportMode);
    setPickingMode(null);
  };

  const clearRoute = () => {
    setRouteGeoJSON(null);
    setStartPoint(null);
    setEndPoint(null);
    setStartAddress("");
    setEndAddress("");
    setPickingMode(null);
    setRouteDuration(null);
    if (userLocationMarker) {
      userLocationMarker.remove();
      setUserLocationMarker(null);
    }
    if (startPin) {
      startPin.remove();
      setStartPin(null);
    }
    if (endPin) {
      endPin.remove();
      setEndPin(null);
    }
    if (mapRef.current) {
      const map = mapRef.current;
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route-source")) map.removeSource("route-source");
    }
  };

  const createDraggablePin = (mode: "start" | "end") => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const center = map.getCenter();
    const point = { lng: center.lng, lat: center.lat };
    const address = `Coord: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;

    if (mode === "start") {
      if (startPin) {
        startPin.setLngLat(center);
        setStartPoint(point);
        setStartAddress(address);
        return;
      }
      const newStartPin = new maplibregl.Marker({
        draggable: true,
        color: "#007cff",
      })
        .setLngLat(center)
        .addTo(map);
      setStartPoint(point);
      setStartAddress(address);
      newStartPin.on("dragend", () => {
        const lngLat = newStartPin.getLngLat();
        const point = { lng: lngLat.lng, lat: lngLat.lat };
        const address = `Coord: ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(
          4
        )}`;
        setStartPoint(point);
        setStartAddress(address);
      });
      setStartPin(newStartPin);
    } else {
      if (endPin) {
        endPin.setLngLat(center);
        setEndPoint(point);
        setEndAddress(address);
        return;
      }
      const newEndPin = new maplibregl.Marker({
        draggable: true,
        color: "#c00000",
      })
        .setLngLat(center)
        .addTo(map);
      setEndPoint(point);
      setEndAddress(address);
      newEndPin.on("dragend", () => {
        const lngLat = newEndPin.getLngLat();
        const point = { lng: lngLat.lng, lat: lngLat.lat };
        const address = `Coord: ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(
          4
        )}`;
        setEndPoint(point);
        setEndAddress(address);
      });
      setEndPin(newEndPin);
    }
  };

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    const removeAllPopups = () => {
      try {
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
      } catch {}
      try {
        document
          .querySelectorAll(".maplibregl-popup")
          .forEach((el) => el.remove());
      } catch {}
    };

    const map = new maplibregl.Map({
      container: "map",
      style: `https://tiles.openfreemap.org/styles/${mapType}`,
      center: [122.56, 10.72],
      zoom: 16,
      pitch: 60,
      bearing: 0,
      dragRotate: true,
      dragPan: true,
    });
    map.dragRotate.enable();
    mapRef.current = map;

    map.on("load", () => {
      console.log("Map loaded, waiting for risk database...");
      removeAllPopups();
      map.flyTo({ center: [122.55012452602386, 10.808910380678128], zoom: 14 });
      // --- FIX: Set map loaded state to true ---
      setIsMapLoaded(true);
    });

    return () => {
      removeAllPopups();
      map.remove();
    };
  }, []); // This should only run once

  //  Using the refs for mapping
  useEffect(() => {
    pickingModeRef.current = pickingMode;
  }, [pickingMode]);

  // --- UPDATED: FIREBASE DATA FETCHING ---
  useEffect(() => {
    // 1. Fetch all responders from the 'responders' document inside the uniqueID collection
    // Fetch for BOTH admin and user modes
    if (uniqueID) {
      console.log(
        `🔍 [${mode}] Attempting to fetch responders for uniqueID: ${uniqueID}`
      );

      // Fetch from: uniqueID/responders document (e.g., PH063043000/responders)
      const respondersDocRef = doc(db, uniqueID, "responders");

      const unsubscribe = onSnapshot(
        respondersDocRef,
        (docSnap) => {
          console.log(
            `📡 [${mode}] Snapshot received for ${uniqueID}/responders`
          );

          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log(`📦 [${mode}] Document data:`, data);

            // Get the responderList array
            const responderList = data?.responderList || [];
            console.log(`👥 [${mode}] Responder list found:`, responderList);

            // Map the responderList to Person objects
            const responders: Person[] = responderList.map((r: any) => ({
              id: r.uid, // Use uid as the id
              name: r.name,
              email: r.email,
              role: r.role,
              profilePictureUrl: r.profilePictureUrl, // Include profile picture
              skills: r.skills, // Include skills object with hard and soft arrays
              personality: r.personality, // Include personality
            }));

            setAllResponders(responders);
            console.log(
              `✅ [${mode}] Successfully set ${responders.length} responders:`,
              responders
            );
          } else {
            console.warn(
              `⚠️ [${mode}] No responders document found at ${uniqueID}/responders`
            );
            setAllResponders([]);
          }
        },
        (error) => {
          console.error(`❌ [${mode}] Error fetching responders:`, error);
          setAllResponders([]);
        }
      );

      return () => unsubscribe();
    } else {
      console.log(
        `⏭️ Skipping responder fetch - mode: ${mode}, uniqueID: ${uniqueID}`
      );
    }
  }, [mode, uniqueID]); // Re-run if mode or uniqueID changes

  // --- FETCH BLOCKAGES FROM FIREBASE ---
  useEffect(() => {
    if (!uniqueID) {
      console.log("⏭️ Skipping blockage fetch - no uniqueID");
      return;
    }

    const blockageDocRef = doc(db, uniqueID, "blockage");
    const unsubscribe = onSnapshot(
      blockageDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const blockageList = data?.blockages || [];
          setBlockages(blockageList);
          console.log(
            `🚧 Fetched ${blockageList.length} blockages:`,
            blockageList
          );
        } else {
          console.log("📝 No blockage document found");
          setBlockages([]);
        }
      },
      (error) => {
        console.error("❌ Error fetching blockages:", error);
        setBlockages([]);
      }
    );

    return () => unsubscribe();
  }, [uniqueID]);

  // --- BLOCKAGE MANAGEMENT FUNCTIONS ---
  const addBlockage = async (name: string, coordinates: number[][][]) => {
    if (!uniqueID || !user) {
      console.error("❌ Cannot add blockage: missing uniqueID or user");
      return;
    }

    // Convert coordinates to JSON string to avoid nested arrays in Firestore
    const newBlockage: Blockage = {
      id: `blockage_${Date.now()}`,
      name,
      coordinates: JSON.stringify(coordinates),
      createdBy: user.uid,
      createdAt: Date.now(),
    };

    const blockageDocRef = doc(db, uniqueID, "blockage");

    try {
      const docSnap = await getDoc(blockageDocRef);

      if (docSnap.exists()) {
        // Document exists, update it
        const existingBlockages = docSnap.data()?.blockages || [];
        await updateDoc(blockageDocRef, {
          blockages: [...existingBlockages, newBlockage],
        });
        console.log("✅ Blockage added successfully");
      } else {
        // Document doesn't exist, create it
        await setDoc(blockageDocRef, {
          blockages: [newBlockage],
        });
        console.log("✅ Blockage document created with first blockage");
      }
    } catch (err) {
      console.error("❌ Error adding blockage:", err);
      alert(`Error adding blockage: ${err}`);
    }
  };

  const removeBlockage = async (blockageId: string) => {
    if (!uniqueID) return;

    const blockageDocRef = doc(db, uniqueID, "blockage");

    try {
      const docSnap = await getDoc(blockageDocRef);
      if (docSnap.exists()) {
        const existingBlockages = docSnap.data()?.blockages || [];
        const updatedBlockages = existingBlockages.filter(
          (b: Blockage) => b.id !== blockageId
        );

        await updateDoc(blockageDocRef, {
          blockages: updatedBlockages,
        });
        console.log("✅ Blockage removed successfully");
      }
    } catch (error) {
      console.error("❌ Error removing blockage:", error);
    }
  };

  // Handle boundary loading separately
  useEffect(() => {
    // --- FIX: Wait for map to be loaded ---
    if (
      !isMapLoaded ||
      !mapRef.current ||
      !riskDatabase ||
      riskDatabase.length === 0
    ) {
      console.log("Boundary loading skipped - map or data not ready");
      return;
    }

    const map = mapRef.current;
    const boundary = riskDatabase.find(
      (d: any) => d.id === "boundary"
    ) as BoundaryEntry;

    if (!boundary || !boundary.boundary) {
      console.warn("❌ Boundary entry not found or is empty in riskDatabase");
      return;
    }

    try {
      let boundaryData =
        typeof boundary.boundary === "string"
          ? JSON.parse(boundary.boundary)
          : boundary.boundary;

      if (!boundaryData || !boundaryData.type) {
        console.error("❌ Invalid boundary data - missing type property");
        return;
      }

      if (map.getSource("boundary")) {
        (map.getSource("boundary") as maplibregl.GeoJSONSource).setData(
          boundaryData
        );
      } else {
        map.addSource("boundary", {
          type: "geojson",
          data: boundaryData,
        });
      }

      if (!map.getLayer("boundary")) {
        map.addLayer({
          id: "boundary",
          type: "line",
          source: "boundary",
          paint: {
            "line-color": "#ff0000",
            "line-width": 3,
            "line-opacity": 0.35,
          },
        });
      }
    } catch (error) {
      console.error("❌ Error loading boundary:", error);
    }
  }, [riskDatabase, isMapLoaded]); // Added isMapLoaded

  // ... (useEffect for initial heatmap - unchanged)
  useEffect(() => {
    if (
      !mapRef.current ||
      !riskDatabase ||
      riskDatabase.length === 0 ||
      !isHeatmapEnabled
    ) {
      return;
    }
    const hazard = selectedRisk;
    createHeatmapLayer(hazard);
  }, [riskDatabase, isHeatmapEnabled, selectedRisk]);

  // ... (useEffect for marker visibility - unchanged)
  useEffect(() => {
    if (!mapRef.current || !areMarkersVisible) return;
    const map = mapRef.current;
    const hazard = selectedRisk;
    const markerLayers = [
      `${hazard}-risk`,
      "responderLocation",
      "clusters",
      "cluster-count",
    ];
    markerLayers.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, "visibility", "visible");
      }
    });
  }, [selectedRisk, areMarkersVisible]);

  // ... (useEffect for userLocation - unchanged)
  useEffect(() => {
    if (mapRef.current && userLocation) {
      const map = mapRef.current;
      if (userLocationMarker) {
        userLocationMarker.remove();
      }
      const markerElement = document.createElement("div");
      markerElement.className = "user-location-marker";
      markerElement.style.width = "24px";
      markerElement.style.height = "24px";
      markerElement.style.borderRadius = "50%";
      markerElement.style.backgroundColor = "#007cff";
      markerElement.style.border = "3px solid #ffffff";
      markerElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      const newMarker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
      setUserLocationMarker(newMarker);
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
      });
      if (isRoutingPanelOpen || !startPoint) {
        setStartPoint(userLocation);
        setStartAddress("My Location");
      }
    }
  }, [userLocation]);

  // ... (useEffect for drawing route - unchanged)
  useEffect(() => {
    if (!mapRef.current || !routeGeoJSON) return;
    const map = mapRef.current;
    const routeLayerId = "route-line";
    const routeSourceId = "route-source";

    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);

    map.addSource(routeSourceId, {
      type: "geojson",
      data: routeGeoJSON,
    });
    map.addLayer({
      id: routeLayerId,
      type: "line",
      source: routeSourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#c00000", "line-width": 5, "line-opacity": 0.8 },
    });

    if (routeGeoJSON.features && routeGeoJSON.features[0].bbox) {
      const bbox = routeGeoJSON.features[0].bbox;
      map.fitBounds(
        [
          [bbox[0], bbox[1]], // minLng, minLat
          [bbox[2], bbox[3]], // maxLng, maxLat
        ],
        { padding: 80, duration: 1000 }
      );
    }
  }, [routeGeoJSON]);

  // --- BLOCKAGE DRAWING HANDLER ---
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawingBlockage) return;

      try {
        const { lng, lat } = e.lngLat;
        console.log("✏️ Drawing point:", {
          lng,
          lat,
          currentPoints: drawingPoints.length,
        });

        const newPoints = [...drawingPoints, [lng, lat]];
        setDrawingPoints(newPoints);

        console.log(
          "✅ Point added successfully. Total points:",
          newPoints.length
        );
      } catch (error) {
        console.error("❌ Error in handleMapClick:", error);
      }
    };

    // Keyboard handlers removed - now using bottom buttons for control
    // const handleKeyPress = async (e: KeyboardEvent) => {
    //   if (!isDrawingBlockage) return;
    //   if (e.key === "Enter" && drawingPoints.length >= 3) {
    //     // Complete the polygon
    //     const blockageName =
    //       prompt("Enter blockage name:") || "Unnamed Blockage";
    //     // Close the polygon by adding first point at the end
    //     const closedCoordinates = [...drawingPoints, drawingPoints[0]];
    //     // Create polygon coordinates in GeoJSON format
    //     const polygonCoordinates = [closedCoordinates];
    //     console.log("Saving blockage:", {
    //       name: blockageName,
    //       coordinates: polygonCoordinates,
    //     });
    //     await addBlockage(blockageName, polygonCoordinates);
    //     // Clean up
    //     setIsDrawingBlockage(false);
    //     setDrawingPoints([]);
    //     alert("Blockage added successfully!");
    //   } else if (e.key === "Escape") {
    //     // Cancel drawing
    //     console.log("Canceling blockage drawing");
    //     setIsDrawingBlockage(false);
    //     setDrawingPoints([]);
    //     alert("Blockage drawing cancelled");
    //   }
    // };

    if (isDrawingBlockage) {
      console.log("🎨 Drawing mode activated - attaching click handler");
      console.log("Map object exists:", !!map);
      console.log("Map loaded:", isMapLoaded);

      // Add the click handler
      map.on("click", handleMapClick);
      // Keyboard control removed - using bottom buttons instead
      // window.addEventListener("keydown", handleKeyPress);

      // Change cursor to crosshair when drawing
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = "crosshair";
        console.log("✅ Cursor changed to crosshair, ready to draw!");
      }

      // Test if clicks are being captured
      const testHandler = (e: any) => {
        console.log("🖱️ MAP CLICKED! Position:", e.lngLat);
      };
      map.on("click", testHandler);

      return () => {
        console.log("🧹 Cleaning up drawing handlers");
        map.off("click", handleMapClick);
        map.off("click", testHandler);
        // Keyboard handler removed
        // window.removeEventListener("keydown", handleKeyPress);
        if (map.getCanvas()) {
          map.getCanvas().style.cursor = "";
        }
      };
    } else {
      return () => {
        map.off("click", handleMapClick);
        // Keyboard handler removed
        // window.removeEventListener("keydown", handleKeyPress);
        if (map.getCanvas()) {
          map.getCanvas().style.cursor = "";
        }
      };
    }
  }, [isDrawingBlockage, drawingPoints, addBlockage, isMapLoaded]);

  // --- DISPLAY DRAWING PREVIEW ---
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !isDrawingBlockage) return;
    const map = mapRef.current;

    const drawingSourceId = "drawing-preview-source";
    const drawingPointsLayerId = "drawing-preview-points";
    const drawingLineLayerId = "drawing-preview-line";
    const drawingPolygonLayerId = "drawing-preview-polygon";

    try {
      // Remove existing preview layers
      if (map.getLayer(drawingPolygonLayerId))
        map.removeLayer(drawingPolygonLayerId);
      if (map.getLayer(drawingLineLayerId)) map.removeLayer(drawingLineLayerId);
      if (map.getLayer(drawingPointsLayerId))
        map.removeLayer(drawingPointsLayerId);
      if (map.getSource(drawingSourceId)) map.removeSource(drawingSourceId);

      if (drawingPoints.length === 0) return;

      // Create GeoJSON with points and lines
      const features: GeoJSON.Feature[] = [];

      // Add point markers
      drawingPoints.forEach((point, index) => {
        features.push({
          type: "Feature",
          properties: { index },
          geometry: {
            type: "Point",
            coordinates: point,
          },
        });
      });

      // Add line if we have at least 2 points
      if (drawingPoints.length >= 2) {
        features.push({
          type: "Feature",
          properties: { type: "line" },
          geometry: {
            type: "LineString",
            coordinates: drawingPoints,
          },
        });
      }

      // Add polygon preview if we have at least 3 points
      if (drawingPoints.length >= 3) {
        const closedCoords = [...drawingPoints, drawingPoints[0]];
        features.push({
          type: "Feature",
          properties: { type: "polygon" },
          geometry: {
            type: "Polygon",
            coordinates: [closedCoords],
          },
        });
      }

      const geoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: features,
      };

      // Add source
      map.addSource(drawingSourceId, {
        type: "geojson",
        data: geoJSON,
      });

      // Add polygon fill layer (if 3+ points)
      if (drawingPoints.length >= 3) {
        map.addLayer({
          id: drawingPolygonLayerId,
          type: "fill",
          source: drawingSourceId,
          filter: ["==", ["get", "type"], "polygon"],
          paint: {
            "fill-color": "#ff6600",
            "fill-opacity": 0.2,
          },
        });
      }

      // Add line layer (if 2+ points)
      if (drawingPoints.length >= 2) {
        map.addLayer({
          id: drawingLineLayerId,
          type: "line",
          source: drawingSourceId,
          filter: ["==", ["get", "type"], "line"],
          paint: {
            "line-color": "#ff6600",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
      }

      // Add point markers layer
      map.addLayer({
        id: drawingPointsLayerId,
        type: "circle",
        source: drawingSourceId,
        filter: ["has", "index"],
        paint: {
          "circle-radius": 6,
          "circle-color": "#ff6600",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });

      console.log(
        "✏️ Drawing preview updated:",
        drawingPoints.length,
        "points"
      );
    } catch (error) {
      console.error("❌ Error updating drawing preview:", error);
    }

    return () => {
      try {
        if (map.getLayer(drawingPolygonLayerId))
          map.removeLayer(drawingPolygonLayerId);
        if (map.getLayer(drawingLineLayerId))
          map.removeLayer(drawingLineLayerId);
        if (map.getLayer(drawingPointsLayerId))
          map.removeLayer(drawingPointsLayerId);
        if (map.getSource(drawingSourceId)) map.removeSource(drawingSourceId);
      } catch (error) {
        console.error("Error cleaning up drawing preview:", error);
      }
    };
  }, [drawingPoints, isDrawingBlockage, isMapLoaded]);

  // --- DISPLAY BLOCKAGES ON MAP ---
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    const map = mapRef.current;

    const blockageSourceId = "blockages-source";
    const blockageLayerId = "blockages-layer";
    const blockageOutlineLayerId = "blockages-outline-layer";

    try {
      // Remove existing layers and source
      if (map.getLayer(blockageOutlineLayerId)) {
        map.removeLayer(blockageOutlineLayerId);
      }
      if (map.getLayer(blockageLayerId)) {
        map.removeLayer(blockageLayerId);
      }
      if (map.getSource(blockageSourceId)) {
        map.removeSource(blockageSourceId);
      }

      if (blockages.length === 0) {
        console.log("No blockages to display");
        return;
      }

      console.log("🗺️ Displaying blockages:", blockages);

      // Create GeoJSON from blockages
      const blockageGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: blockages
          .map((blockage) => {
            try {
              console.log(
                "📍 Processing blockage:",
                blockage.name,
                "ID:",
                blockage.id
              );
              console.log("📍 Raw coordinates string:", blockage.coordinates);

              const coordinates = JSON.parse(blockage.coordinates);
              console.log("📍 Parsed coordinates:", coordinates);

              const feature = {
                type: "Feature" as const,
                properties: {
                  id: blockage.id,
                  name: blockage.name,
                },
                geometry: {
                  type: "Polygon" as const,
                  coordinates: coordinates,
                },
              };

              console.log("✅ Created feature:", feature);
              return feature;
            } catch (error) {
              console.error(
                "❌ Error parsing blockage coordinates:",
                error,
                blockage
              );
              return null;
            }
          })
          .filter(Boolean) as GeoJSON.Feature[],
      };

      console.log(
        "🎨 Final GeoJSON:",
        JSON.stringify(blockageGeoJSON, null, 2)
      );

      if (blockageGeoJSON.features.length === 0) {
        console.warn("⚠️ No valid blockage features to display");
        return;
      }

      // Add source
      map.addSource(blockageSourceId, {
        type: "geojson",
        data: blockageGeoJSON,
      });

      // Add fill layer
      map.addLayer({
        id: blockageLayerId,
        type: "fill",
        source: blockageSourceId,
        paint: {
          "fill-color": "#ff6600",
          "fill-opacity": 0.3,
        },
      });

      // Add outline layer
      map.addLayer({
        id: blockageOutlineLayerId,
        type: "line",
        source: blockageSourceId,
        paint: {
          "line-color": "#ff6600",
          "line-width": 2,
          "line-dasharray": [2, 2],
        },
      });

      // Add click handler to show blockage info
      map.on("click", blockageLayerId, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const name = feature.properties?.name || "Unknown";

        new maplibregl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(`<strong>Blockage:</strong> ${name}`)
          .addTo(map);
      });

      // Change cursor on hover
      map.on("mouseenter", blockageLayerId, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", blockageLayerId, () => {
        map.getCanvas().style.cursor = "";
      });

      console.log("✅ Blockages displayed successfully");
    } catch (error) {
      console.error("❌ Error displaying blockages on map:", error);
    }
  }, [blockages, isMapLoaded]);

  // --- REMOVED: syncAllResponderLocations function ---
  // --- REMOVED: useEffect for Admin Sync ---

  // --- UPDATED: useEffect for hazard switching ---
  useEffect(() => {
    // --- FIX: Wait for map to be loaded ---
    if (
      !isMapLoaded ||
      !mapRef.current ||
      !riskDatabase ||
      riskDatabase.length === 0
    ) {
      return;
    }

    const map = mapRef.current;

    // --- 1. Clear previous HAZARD-SPECIFIC layers ---
    try {
      document
        .querySelectorAll(".maplibregl-popup")
        .forEach((el) => el.remove());
      currentPopupRef.current?.remove();
      currentPopupRef.current = null;
    } catch {}
    const layersToRemove = [
      `${currentHazard}-risk`,
      `${currentHazard}-heatmap`,
      "clusters",
      "cluster-count",
      "unclustered-point",
    ];
    layersToRemove.forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });
    const sourcesToRemove = [
      `${currentHazard}-risk`,
      `${currentHazard}-heatmap-source`,
    ];
    sourcesToRemove.forEach((sourceId) => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    // --- Also remove old responder/range layers to be safe ---
    if (map.getLayer("responderLocation")) map.removeLayer("responderLocation");
    if (map.getSource("responder-source")) map.removeSource("responder-source");
    if (map.getLayer("responderRange")) map.removeLayer("responderRange");
    if (map.getSource("range-source")) map.removeSource("range-source");

    // --- 2. Load new HAZARD-SPECIFIC data ---
    const hazard = selectedRisk;
    const riskData = riskDatabase.find(
      (d: { id: string }) => d.id === hazard
    ) as HazardEntry;

    // --- 3. Load hazard-specific RESPONDER data ---
    // This is the fix. We look for 'responderflooding', 'responderlandslide', etc.
    const responderDataDoc = riskDatabase.find(
      (d: { id: string }) => d.id === `responder${hazard}`
    ) as HazardEntry;

    try {
      // --- 4. Add HAZARD layers (if they exist) ---
      if (riskData && riskData.risk) {
        let riskGeoJSON =
          typeof riskData.risk === "string"
            ? JSON.parse(riskData.risk)
            : riskData.risk;
        const vulnerabilityData = riskDatabase.find(
          (d: any) => d.id === "population_vulnerability"
        );
        if (vulnerabilityData && riskGeoJSON.features) {
          riskGeoJSON.features = enhanceFeaturesWithVulnerability(
            riskGeoJSON.features,
            vulnerabilityData
          );
        }

        if (map.getSource(`${hazard}-risk`)) {
          (map.getSource(`${hazard}-risk`) as maplibregl.GeoJSONSource).setData(
            riskGeoJSON
          );
        } else {
          map.addSource(`${hazard}-risk`, {
            type: "geojson",
            data: riskGeoJSON,
            cluster: true,
            clusterMaxZoom: 17,
            clusterRadius: 50,
          });
        }

        map
          .loadImage(`/icons/${hazard}.png`) // FIX: Absolute path
          .then((res) => {
            const image = res.data;
            if (!map.hasImage(hazard)) map.addImage(hazard, image);
            if (!map.getLayer(`${hazard}-risk`)) {
              map.addLayer({
                id: `${hazard}-risk`,
                type: "symbol",
                source: `${hazard}-risk`,
                filter: ["!", ["has", "point_count"]],
                layout: { "icon-image": hazard, "icon-size": 0.5 },
              });
            }
          })
          .catch((error) =>
            console.error("Failed to load hazard image:", error)
          );

        if (!map.getLayer("clusters")) {
          map.addLayer({
            id: "clusters",
            type: "circle",
            source: `${hazard}-risk`,
            filter: ["has", "point_count"],
            paint: {
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#f23411",
                100,
                "#f1f075",
                750,
                "#f28cb1",
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40,
              ],
            },
          });
        }
        if (!map.getLayer("cluster-count")) {
          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: `${hazard}-risk`,
            filter: ["has", "point_count"],
            layout: {
              "text-field": "{point_count_abbreviated}",
              "text-font": ["Noto Sans Regular"],
              "text-size": 12,
            },
          });
        }
        // Removed 'unclustered-point' circle layer; using icon-based hazard pins only.
      } // End if (riskData.risk)

      // --- 5. Add/Update RESPONDER layers (from *responderDataDoc*) ---
      let responderGeoJSON: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [],
      };
      // Check if the responder doc (e.g., responderflooding) exists
      if (responderDataDoc) {
        try {
          // --- FIX: The document *is* the map, but it includes an 'id' field.
          // We must copy the object and remove 'id' before processing.
          const locationsMap = { ...responderDataDoc };
          delete (locationsMap as any).id; // Remove the 'id' field
          // Now locationsMap is just { "0": {...}, "1": {...}, ... }

          // We use Object.entries() to turn this map into an array of features
          const features = Object.entries(locationsMap).map(
            ([key, feature]: [string, any]) => {
              // We must ensure the locationid is in the properties for the click handler
              const properties = feature.properties || {};

              // --- CRITICAL FIX: Add the key ("0", "1") as point_key_id ---
              properties.point_key_id = key;

              if (feature.properties?.locationid) {
                properties.locationid = feature.properties.locationid;
              }
              if (feature.properties?.name) {
                properties.name = feature.properties.name;
              }

              return {
                type: "Feature",
                geometry: feature.geometry,
                properties: properties,
              };
            }
          );

          responderGeoJSON = {
            type: "FeatureCollection",
            features: features as GeoJSON.Feature[], // Cast to valid GeoJSON features
          };
        } catch (e) {
          console.error("Failed to parse responderLocation Map", e);
        }
      }

      map.addSource("responder-source", {
        type: "geojson",
        data: responderGeoJSON,
      });

      map
        .loadImage("/icons/responder.png") // FIX: Absolute path
        .then((res) => {
          const image = res.data;
          if (!map.hasImage("responder")) map.addImage("responder", image);
          if (!map.getLayer("responderLocation")) {
            map.addLayer({
              id: "responderLocation",
              type: "symbol",
              source: "responder-source",
              layout: { "icon-image": "responder", "icon-size": 0.5 },
            });
            try {
              // Ensure responder pins sit above clusters and other symbols
              // Move to topmost position
              (map as any).moveLayer("responderLocation");
            } catch (e) {
              console.warn("Could not move responderLocation layer to top:", e);
            }
          }
        })
        .catch((error) =>
          console.error("Failed to load responder image:", error)
        );

      // --- 6. Add/Update RANGE layer (from *responderDataDoc*) ---
      if (responderDataDoc && responderDataDoc.responderRange) {
        let rangeGeoJSON =
          typeof responderDataDoc.responderRange === "string"
            ? JSON.parse(responderDataDoc.responderRange)
            : responderDataDoc.responderRange;

        map.addSource("range-source", {
          type: "geojson",
          data: rangeGeoJSON,
        });
        map.addLayer({
          id: "responderRange",
          type: "line",
          source: "range-source",
          paint: {
            "line-color": "#008000",
            "line-width": 3,
            "line-opacity": 0.35,
          },
        });
      } // End if (responderDataDoc.responderRange)

      // --- 7. Heatmap ---
      if (isHeatmapEnabled) {
        createHeatmapLayer(hazard);
      }

      setCurrentHazard(selectedRisk);
    } catch (error) {
      console.error("Error switching hazard:", error);
    }
  }, [isMapLoaded, selectedRisk, riskDatabase, isHeatmapEnabled]);

  // --- UPDATED: Click Handlers useEffect ---
  // Moved all click handlers here to be registered only once
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const onClusterClick = async (e: maplibregl.MapLayerMouseEvent) => {
      // Don't handle clicks when in drawing mode
      if (isDrawingBlockage) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["clusters"],
      });
      if (!features.length) return;
      const clusterFeature = features[0] as ClusterFeature;
      const pointCount = clusterFeature.properties.point_count;
      const clusterLngLat = (clusterFeature.geometry as GeoJSON.Point)
        .coordinates as [number, number];

      const popupContent = `
         <div style="padding: 8px; max-width: 200px; color: black;">
           <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">Cluster</h3>
           <p style="margin: 4px 0;"><strong>Points:</strong> ${pointCount}</p>
           <p style="margin: 4px 0; font-size: 12px; color: #667;">Click to zoom in</p>
         </div>
       `;
      try {
        new Popup().setLngLat(clusterLngLat).setHTML(popupContent).addTo(map);
      } catch (error) {
        console.error("Error creating cluster popup:", error);
      }

      const clusterId = clusterFeature.properties.cluster_id;
      const source = map.getSource(
        `${selectedRisk}-risk` // Use selectedRisk
      ) as maplibregl.GeoJSONSource & {
        getClusterExpansionZoom: (clusterId: number) => Promise<number>;
      };
      const zoom = await source.getClusterExpansionZoom(clusterId);
      map.easeTo({
        center: clusterLngLat,
        zoom,
      });
    };

    const onRiskClick = (e: maplibregl.MapLayerMouseEvent) => {
      // Don't handle clicks when in drawing mode
      if (isDrawingBlockage) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: [`${selectedRisk}-risk`],
      });
      if (features.length === 0) return;

      const feature = features[0];
      const properties = feature.properties;
      const barangay = properties?.ADM4_EN || "Unknown";
      const riskScore = properties?.risk_score ?? 0;
      const populationRaw = (properties?.population ??
        properties?.pop ??
        properties?.POPULATION) as number | string | undefined;
      const population =
        typeof populationRaw === "number"
          ? populationRaw
          : typeof populationRaw === "string"
          ? parseInt(populationRaw.replace(/[^0-9]/g, ""))
          : undefined;

      let displayLng: string | null = null;
      let displayLat: string | null = null;
      if (
        feature.geometry.type === "Point" &&
        Array.isArray((feature.geometry as any).coordinates)
      ) {
        const c = (feature.geometry as any).coordinates as [number, number];
        displayLng = typeof c[0] === "number" ? c[0].toFixed(5) : null;
        displayLat = typeof c[1] === "number" ? c[1].toFixed(5) : null;
      }

      const hazardNameMap: Record<string, string> = {
        earthquake: "Earthquake Risk",
        flooding: "Flood Risk",
        landslide: "Landslide Risk",
      };
      const hazardTitle = hazardNameMap[selectedRisk] || `${selectedRisk} Risk`;
      const accentMap: Record<string, string> = {
        // Use brand colors
        earthquake: "#36A816", // brand-earthquake
        flooding: "#1883D0",   // brand-flood
        landslide: "#C38811",  // brand-landslide
      };
      const accent = accentMap[selectedRisk] || "#ef4444";
      const iconMap: Record<string, string> = {
        flooding: "/icons/flood icon.svg",
        landslide: "/icons/landslide icon.svg",
        earthquake: "/icons/earthquake icon.svg",
      };
      const iconPath = iconMap[selectedRisk] || `/icons/${selectedRisk}.svg`; // FIX: Absolute path

      const toPercent = (v: any) => {
        if (typeof v === "number") {
          const p = v <= 1 ? v * 100 : v;
          return `${p.toFixed(2)}%`;
        }
        const n = Number(v);
        return isNaN(n)
          ? String(v ?? "N/A")
          : `${(n <= 1 ? n * 100 : n).toFixed(2)}%`;
      };

      const popupContent = `
<div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; color:#111827;">
  <div style="background:#ffffff;border-radius:18px;box-shadow:0 12px 28px rgba(0,0,0,0.18);padding:16px 18px;min-width:340px;max-width:480px;">
    <div style="display:flex;align-items:center;gap:14px;position:relative;">
      <div style="width:36px;height:36px;border-radius:999px;background:${accent};display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
        <div style="width:20px;height:20px;background:#ffffff;mask:url('${iconPath}') center/contain no-repeat;-webkit-mask:url('${iconPath}') center/contain no-repeat;"></div>
      </div>
      <div style="flex:1 1 auto;display:flex;flex-direction:column;justify-content:center;gap:2px;min-width:0;">
        <div style="font-weight:700;font-size:22px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${hazardTitle}</div>
        <div style="font-size:13px;color:#6b7280;">Calculated by Hazard and Population Data</div>
      </div>
      <button class="emerge-popup-close" aria-label="Close" style="cursor:pointer;width:24px;height:24px;border:none;outline:none;border-radius:999px;background:#e5e7eb;color:#374151;display:grid;place-items:center;line-height:0;position:absolute;right:0;top:0;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div style="margin-top:12px;border-top:1px solid #e5e7eb;padding-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;">
      <div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:2px;">Severity</div>
        <div style="font-weight:600;color:${accent};text-decoration:none;">${toPercent(
        riskScore
      )}</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:8px;"></div>
      </div>
      <div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:2px;">Location</div>
  <div style="font-weight:600;color:${accent};text-decoration:none;">${barangay}</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:8px;"></div>
      </div>
      <div style="grid-column:1 / span 1;">
        <div style="font-size:13px;color:#6b7280;margin-bottom:2px;">Coordinates</div>
        <div style="font-weight:600;color:${accent};text-decoration:none;">${
        displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"
      }</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:8px;"></div>
      </div>
      <div style="grid-column:2 / span 1;">
        <div style="font-size:13px;color:#6b7280;margin-bottom:2px;">Population</div>
        <div style="font-weight:600;color:${accent};text-decoration:none;">${
        population ? population.toLocaleString() : "N/A"
      }</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:8px;"></div>
      </div>
    </div>
  </div>
</div>`;

      let lngLat: [number, number] | undefined;
      if (
        feature.geometry.type === "Point" &&
        Array.isArray(feature.geometry.coordinates)
      ) {
        const coords = feature.geometry.coordinates as [number, number];
        lngLat = [coords[0], coords[1]];
        while (Math.abs(e.lngLat.lng - lngLat[0]) > 180) {
          lngLat[0] += e.lngLat.lng > lngLat[0] ? 360 : -360;
        }
      }

      if (lngLat) {
        try {
          document
            .querySelectorAll(".maplibregl-popup")
            .forEach((el) => el.remove());
          currentPopupRef.current?.remove();
          const popup = new maplibregl.Popup({
            offset: [16, -16],
            anchor: "bottom-left",
            closeButton: false,
          })
            .setLngLat(lngLat)
            .setHTML(popupContent)
            .addTo(map);
          currentPopupRef.current = popup;
          const el = popup.getElement();
          const closeBtn = el?.querySelector(
            ".emerge-popup-close"
          ) as HTMLElement | null;
          if (closeBtn) {
            closeBtn.addEventListener("click", (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              popup.remove();
              currentPopupRef.current = null;
            });
          }
          map.flyTo({ center: lngLat, zoom: 14 });
        } catch (error) {
          console.error("Error creating popup:", error);
        }
      }
    };

    const onResponderClick = (e: maplibregl.MapLayerMouseEvent) => {
      // Don't handle clicks when in drawing mode
      if (isDrawingBlockage) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["responderLocation"],
      });
      if (!features.length) return;

      const feature = features[0];
      const properties = feature.properties;

      // --- FIX: Get the point_key_id ("0", "1", etc.) ---
      const docId = properties?.point_key_id;

      if (!docId) {
        console.error(
          "Clicked responder point missing 'point_key_id' property."
        );
        return;
      }

      if (pickingModeRef.current) {
        const mode = pickingModeRef.current;
        if (
          feature.geometry.type === "Point" &&
          Array.isArray((feature.geometry as any).coordinates)
        ) {
          const c = (feature.geometry as any).coordinates as [number, number];
          const point = { lng: c[0], lat: c[1] };
          const address = `Responder: ${properties.name}`;
          if (mode === "start") {
            setStartPoint(point);
            setStartAddress(address);
            if (startPin) startPin.remove();
            setStartPin(null);
          } else if (mode === "end") {
            setEndPoint(point);
            setEndAddress(address);
            if (endPin) endPin.remove();
            setEndPin(null);
          }
          setPickingMode(null);
          e.preventDefault();
          return;
        }
      }

      let lngLat: [number, number] | undefined;
      if (
        feature.geometry.type === "Point" &&
        Array.isArray((feature.geometry as any).coordinates)
      ) {
        const c = (feature.geometry as any).coordinates as [number, number];
        lngLat = [c[0], c[1]];
        while (Math.abs(e.lngLat.lng - lngLat[0]) > 180) {
          lngLat[0] += e.lngLat.lng > lngLat[0] ? 360 : -360;
        }
      }
      if (!lngLat) return;

      // No popup: open the right-side panel immediately
      try {
        document.querySelectorAll(".maplibregl-popup").forEach((el) => el.remove());
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
      } catch {}

      setSelectedPointDocId(docId);
      setSelectedResponderData(properties);
      setIsResponderSidebarOpen(true);
      map.easeTo({
        center: lngLat as [number, number],
        zoom: 14,
        duration: 600,
        padding: { top: 80, right: 380, bottom: 40, left: 40 },
      });
    };

    const onDismissPopup = () => {
      try {
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
        document
          .querySelectorAll(".maplibregl-popup")
          .forEach((el) => el.remove());
      } catch {}
    };

    // Add listeners
    map.on("click", "clusters", onClusterClick);
    map.on("click", `${selectedRisk}-risk`, onRiskClick);
  map.on("click", `${selectedRisk}-risk`, onRiskClick);
    map.on("click", "responderLocation", onResponderClick);
    map.on("dragstart", onDismissPopup);

    map.on(
      "mouseenter",
      "clusters",
      () => (map.getCanvas().style.cursor = "pointer")
    );
    map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
    map.on(
      "mouseenter",
      `${selectedRisk}-risk`,
      () => (map.getCanvas().style.cursor = "pointer")
    );
    map.on(
      "mouseleave",
      `${selectedRisk}-risk`,
      () => (map.getCanvas().style.cursor = "")
    );

    // Cleanup listeners
    return () => {
      if (!map.style) return; // Map might be unmounted
      map.off("click", "clusters", onClusterClick);
      map.off("click", `${selectedRisk}-risk`, onRiskClick);
  map.off("click", `${selectedRisk}-risk`, onRiskClick);
      map.off("click", "responderLocation", onResponderClick);
      map.off("dragstart", onDismissPopup);

      map.on(
        "mouseenter",
        "clusters",
        () => (map.getCanvas().style.cursor = "")
      );
      map.on(
        "mouseleave",
        "clusters",
        () => (map.getCanvas().style.cursor = "")
      );
      map.on(
        "mouseenter",
        `${selectedRisk}-risk`,
        () => (map.getCanvas().style.cursor = "")
      );
      map.on(
        "mouseleave",
        `${selectedRisk}-risk`,
        () => (map.getCanvas().style.cursor = "")
      );
    };
  }, [
    isMapLoaded,
    selectedRisk,
    pickingMode,
    startPin,
    endPin,
    isDrawingBlockage,
  ]); // Dependencies for click handlers

  // Handle search location zooming
  useEffect(() => {
    if (!mapRef.current || !searchLocation) return;
    const map = mapRef.current;
    map.easeTo({
      center: [searchLocation.lng, searchLocation.lat],
      zoom: 15,
      duration: 1000,
    });
    const markerElement = document.createElement("div");
    markerElement.className = "searched-location-marker";
    markerElement.style.width = "20px";
    markerElement.style.height = "20px";
    markerElement.style.backgroundColor = "#ff0000";
    markerElement.style.border = "2px solid #fff";
    markerElement.style.borderRadius = "50%";
    markerElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
    const marker = new maplibregl.Marker({ element: markerElement })
      .setLngLat([searchLocation.lng, searchLocation.lat])
      .addTo(map);
    setTimeout(() => {
      marker.remove();
    }, 5000);
  }, [searchLocation]);

  // Ensure controls remain visible after map loads
  useEffect(() => {
    if (!mapRef.current) return;
    const ensureControlsVisible = () => {
      const controls = document.querySelector(".controls-overlay");
      if (controls) {
        (controls as HTMLElement).style.display = "block";
        (controls as HTMLElement).style.visibility = "visible";
        (controls as HTMLElement).style.opacity = "1";
        (controls as HTMLElement).style.zIndex = "100";
        (controls as HTMLElement).style.position = "absolute";
      }
    };
    mapRef.current.on("load", () => {
      setTimeout(ensureControlsVisible, 100);
    });
    mapRef.current.on("moveend", ensureControlsVisible);
    mapRef.current.on("zoomend", ensureControlsVisible);
    mapRef.current.on("rotateend", ensureControlsVisible);
  }, []);

  // --- RETURN STATEMENT (UI) ---
  return (
    <React.Fragment>
      <div className="relative w-full h-[100vh] md:h-[100vh] z-0 rounded-xl shadow-lg">
        {/* Map container */}
        <div id="map" className="w-full h-full" />

        {/* Drawing Mode Indicator */}
        {isDrawingBlockage && (
          <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none">
            <div className="bg-orange-500 text-white px-6 py-3 rounded-lg shadow-lg border-2 border-white animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                <div className="text-sm md:text-base font-bold">🚧 Drawing Blockage Mode</div>
              </div>
              <div className="text-xs mt-1 opacity-90">Click on the map to add points (minimum 3 points required)</div>
              <div className="text-xs mt-1 font-semibold">Points: {drawingPoints.length}</div>
            </div>
          </div>
        )}

        {/* Drawing Action Buttons */}
        {isDrawingBlockage && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[200] flex gap-3">
            <button
              onClick={() => {
                console.log("Canceling blockage drawing");
                setIsDrawingBlockage(false);
                setDrawingPoints([]);
                alert("Blockage drawing cancelled");
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg border-2 border-white transition-all active:scale-95"
            >
              ✕ Cancel
            </button>
            <button
              onClick={async () => {
                if (drawingPoints.length < 3) {
                  alert("Please add at least 3 points to create a blockage area");
                  return;
                }

                const blockageName = prompt("Enter blockage name:") || "Unnamed Blockage";

                // Close the polygon by adding first point at the end
                const closedCoordinates = [...drawingPoints, drawingPoints[0]];

                // Create polygon coordinates in GeoJSON format
                const polygonCoordinates = [closedCoordinates];

                console.log("Saving blockage:", { name: blockageName, coordinates: polygonCoordinates });
                await addBlockage(blockageName, polygonCoordinates);

                // Clean up
                setIsDrawingBlockage(false);
                setDrawingPoints([]);

                alert("Blockage added successfully!");
              }}
              disabled={drawingPoints.length < 3}
              className={`px-6 py-3 rounded-lg font-semibold shadow-lg border-2 border-white transition-all active:scale-95 ${
                drawingPoints.length >= 3
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
            >
              ✓ Save Blockage {drawingPoints.length >= 3 ? "" : `(${3 - drawingPoints.length} more point${3 - drawingPoints.length === 1 ? "" : "s"})`}
            </button>
          </div>
        )}
      </div>

      {/* Left stack (desktop/tablet): Back + Search + Sidebar */}
      <div className="absolute top-2 md:top-4 left-0 md:left-0 z-[110] pointer-events-none w-full max-w-md hidden md:block">
        <div className="flex flex-col gap-2 pointer-events-auto pl-2">
          <div className="flex items-center gap-2 md:gap-3">
            <Link href="/" aria-label="Back to Home">
              <span className="inline-flex items-center justify-center bg-white text-red-600 rounded-full h-10 w-10 md:h-12 md:w-12 shadow border border-gray-200 hover:bg-red-50 active:scale-95 transition">
                <ArrowLeft size={18} weight="bold" />
              </span>
            </Link>
            <div className="bg-white/90 backdrop-blur-md rounded-[40px] shadow-xl px-3 md:px-4 py-1 md:py-0 pointer-events-auto border border-white/20 h-10 md:h-12 flex items-center w-full max-w-[200px] sm:max-w-[260px] md:max-w-[420px] transition-all">
              <div className="flex items-center gap-1 md:gap-4 w-full h-full">
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-xs md:text-sm text-black"
                  placeholder="Search locations"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSearchSubmit()}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-black min-w-[10px] min-h-[24px] flex items-center justify-center"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  onClick={onSearchSubmit}
                  disabled={isSearching}
                  className="bg-[#E53935] hover:bg-[#D32F2F] disabled:opacity-50 text-white rounded-full h-7 w-7 md:h-9 md:w-9 flex items-center justify-center ml-2 shrink-0 transition-colors"
                >
                  {isSearching ? (
                    <div className="animate-spin w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <MagnifyingGlassIcon size={16} weight={"bold"} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-2">
            <SettingsSidebar
              isOpen={isSidebarOpen}
              onToggle={() => setIsSidebarOpen((s) => !s)}
              isHeatmapEnabled={isHeatmapEnabled}
              onToggleHeatmap={toggleHeatmap}
              areMarkersVisible={areMarkersVisible}
              onToggleMarkers={toggleMarkers}
              clustersCount={clustersCount}
              onClustersCountChange={setClustersCount}
            />
          </div>
        </div>
      </div>

      {/* Mobile top bar: back button + search + profile/avatar */}
      <div className="absolute top-2 left-2 right-2 z-[120] flex items-center gap-2 md:hidden pointer-events-none">
        {/* Back button */}
        <Link
          href="/"
          aria-label="Back to Home"
          className="pointer-events-auto inline-flex items-center justify-center bg-white text-red-600 rounded-full h-10 w-10 shadow border border-gray-200 hover:bg-red-50 active:scale-95 transition"
        >
          <ArrowLeft size={20} weight="bold" />
        </Link>
        <div className="flex-1 relative pointer-events-auto">
          <input
            type="text"
            className="w-full h-10 bg-white/95 backdrop-blur-md rounded-full pl-4 pr-12 text-sm text-black placeholder-gray-500 shadow-lg border border-white/40 outline-none"
            placeholder="Search locations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearchSubmit()}
          />
          {/* Clear button (if text present) */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-600"
              aria-label="Clear search"
            >
              <X size={18} />
            </button>
          )}
          {/* Search icon on right */}
          <button
            onClick={onSearchSubmit}
            disabled={isSearching}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#E53935] hover:bg-[#D32F2F] transition-colors text-white disabled:opacity-60 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white"
            aria-label="Search"
          >
            {isSearching ? (
              <div className="animate-spin w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <MagnifyingGlassIcon size={12} weight="bold" />
            )}
          </button>
        </div>
        {/* Profile / login icon */}
        {user ? (
          <Link
            href={userRole === 'admin' ? '/admin/profile' : '/responder/profile'}
            aria-label="Profile"
            className="pointer-events-auto w-10 h-10 rounded-full overflow-hidden bg-white shadow-lg ring-2 ring-red-600 flex items-center justify-center"
          >
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
                  e.currentTarget.style.display = "none";
                  const nextElement = e.currentTarget.nextElementSibling;
                  if (nextElement) {
                    nextElement.classList.remove("hidden");
                  }
                }}
              />
            ) : null}
            <User
              size={24}
              className={`text-red-600 ${
                (userRole === "admin" && adminProfile?.profilePictureUrl) ||
                user.photoURL
                  ? "hidden"
                  : ""
              }`}
            />
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="Login"
            className="pointer-events-auto w-10 h-10 rounded-full overflow-hidden bg-[#E53935] shadow-lg flex items-center justify-center"
          >
            <User size={24} className="text-white" />
          </Link>
        )}
      </div>

      {/* Hazard Controls - mobile: placed below user icon (top-14); desktop: horizontal centered */}
      <div className="absolute top-14 right-2 md:top-4 md:left-1/2 md:-translate-x-1/2 md:right-auto z-[105] pointer-events-none flex flex-col md:flex-row items-end md:items-center gap-2">
        <div className="flex flex-col md:flex-row items-end md:items-center gap-2 md:gap-3 pointer-events-auto">
          {[
            { id: "flooding", label: "Flood", color: "#0ea5e9", icon: "/icons/flood icon.svg" },
            { id: "earthquake", label: "Earthquake", color: "#36A816", icon: "/icons/earthquake icon.svg" },
            { id: "landslide", label: "Landslide", color: "#C38811", icon: "/icons/landslide icon.svg" },
          ].map((h) => {
            const active = selectedRisk === h.id;
            return (
              <button
                key={h.id}
                onClick={() => onHazardChange(h.id)}
                className={`group inline-flex items-center justify-center rounded-full transition shadow ${
                  active
                    ? "text-white"
                    : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                } w-6 h-6 md:w-auto md:h-auto md:px-4 md:py-2 md:gap-2 ${active ? '' : ''}`}
                style={active ? { background: h.color } : undefined}
                title={`${h.label} Hazard`}
              >
                <span
                  aria-hidden
                  className="w-4 h-4 md:w-4 md:h-4"
                  style={{
                    background: active ? "#ffffff" : "#6b7280",
                    WebkitMask: `url('${h.icon}') center/contain no-repeat`,
                    mask: `url('${h.icon}') center/contain no-repeat`,
                    display: "inline-block",
                  }}
                />
                <span className="hidden md:inline text-sm font-medium">{h.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Profile button - upper right (navbar style) */}
      <div className="absolute top-4 right-4 z-[110] pointer-events-none hidden md:block">
        {user ? (
          <Link
            href={userRole === 'admin' ? '/admin/profile' : '/responder/profile'}
            aria-label="Profile"
            className="pointer-events-auto flex items-center bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl px-3 lg:px-4 py-2 font-bold gap-2 lg:gap-3 transition-colors shadow-lg"
          >
            <div className="flex flex-col items-end min-w-0">
              <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] lg:max-w-[150px]">
                {userRole === "admin" && adminProfile?.name
                  ? adminProfile.name
                  : user.displayName || user.email?.split("@")[0]}
              </span>
              <span className="text-xs font-normal opacity-85 -mt-1 whitespace-nowrap">
                {getRoleDisplayName()}
              </span>
            </div>
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden flex items-center justify-center bg-white/20 flex-shrink-0 ring-2 ring-red-700">
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
                    e.currentTarget.style.display = "none";
                    const nextElement = e.currentTarget.nextElementSibling;
                    if (nextElement) {
                      nextElement.classList.remove("hidden");
                    }
                  }}
                />
              ) : null}
              <UserCircleDashed
                className={`w-full h-full text-white ${
                  (userRole === "admin" && adminProfile?.profilePictureUrl) ||
                  user.photoURL
                    ? "hidden"
                    : ""
                }`}
              />
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            aria-label="Login"
            className="pointer-events-auto flex items-center bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl px-4 py-2 font-bold gap-2 transition-colors shadow-lg"
          >
            <span className="text-sm">Login</span>
            <User size={20} className="text-white" />
          </Link>
        )}
      </div>

      {/* Mobile Settings Sidebar restored to top-left below search/back */}
      <div className="absolute top-14 left-2 z-[110] md:hidden pointer-events-none">
        <div className="pointer-events-auto">
          <SettingsSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen((s) => !s)}
            isHeatmapEnabled={isHeatmapEnabled}
            onToggleHeatmap={toggleHeatmap}
            areMarkersVisible={areMarkersVisible}
            onToggleMarkers={toggleMarkers}
            clustersCount={clustersCount}
            onClustersCountChange={setClustersCount}
          />
        </div>
      </div>

      {/* Legend Icon Button - Bottom Left (aligned with route planning) */}
      <button
        onClick={() => setIsLegendVisible(!isLegendVisible)}
        title={isLegendVisible ? "Hide Legend" : "Show Legend"}
        className="absolute left-4 bottom-4 z-[100] pointer-events-auto bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl"
      >
        <Info size={20} weight="bold" className={isLegendVisible ? 'text-green-600' : 'text-gray-600'} />
      </button>

      {/* Removed standalone bottom-right burger; replaced by consolidated control cluster below */}

      {/* Drawing Mode Indicator - Enhanced for Mobile & Desktop */}
      {isDrawingBlockage && (
        <div className="absolute top-16 md:top-20 left-1/2 -translate-x-1/2 z-[200] pointer-events-none w-[90%] sm:w-auto max-w-md">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-2xl border-2 border-white animate-pulse">
            <div className="flex items-center justify-center gap-2 md:gap-3">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full animate-ping"></div>
              <div className="text-sm md:text-base font-bold">
                🚧 Drawing Blockage Mode
              </div>
            </div>
            <div className="text-xs md:text-sm mt-2 opacity-90 text-center">
              Click on the map to add points
            </div>
            <div className="text-xs md:text-sm mt-1 font-semibold text-center bg-white/20 rounded px-2 py-1">
              Points: {drawingPoints.length} / 3 minimum
            </div>
          </div>
        </div>
      )}

      {/* Drawing Action Buttons - Enhanced for Mobile & Desktop */}
      {isDrawingBlockage && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1001] flex flex-col sm:flex-row gap-3 sm:gap-4 w-[90%] sm:w-auto max-w-2xl pointer-events-auto">
          {/* Cancel Button */}
          <button
            onClick={() => {
              const confirmCancel = window.confirm(
                "Are you sure you want to cancel drawing this blockage? All points will be lost."
              );
              if (confirmCancel) {
                console.log("Canceling blockage drawing");
                setIsDrawingBlockage(false);
                setDrawingPoints([]);
              }
            }}
            className="group relative flex-1 sm:flex-none bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 active:from-red-800 active:to-red-900 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold shadow-[0_10px_40px_rgba(220,38,38,0.4)] hover:shadow-[0_15px_50px_rgba(220,38,38,0.6)] border-2 border-white/30 transition-all duration-300 active:scale-95 hover:scale-[1.02] text-base sm:text-lg uppercase tracking-wider overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl font-bold">✕</span>
              <span className="font-extrabold">Cancel</span>
            </div>
          </button>
          {/* Confirm/Save Button */}
          <button
            onClick={async () => {
              if (drawingPoints.length < 3) {
                alert("Please add at least 3 points to create a blockage area");
                return;
              }

              const blockageName =
                prompt("Enter blockage name:") || "Unnamed Blockage";

              if (!blockageName.trim()) {
                alert("Blockage name cannot be empty");
                return;
              }

              // Close the polygon by adding first point at the end
              const closedCoordinates = [...drawingPoints, drawingPoints[0]];

              // Create polygon coordinates in GeoJSON format
              const polygonCoordinates = [closedCoordinates];

              console.log("Saving blockage:", {
                name: blockageName,
                coordinates: polygonCoordinates,
              });
              await addBlockage(blockageName, polygonCoordinates);

              // Clean up
              setIsDrawingBlockage(false);
              setDrawingPoints([]);

              alert("Blockage added successfully!");
            }}
            disabled={drawingPoints.length < 3}
            className={`group relative flex-1 sm:flex-none px-8 sm:px-12 py-4 sm:py-5 rounded-xl sm:rounded-2xl font-bold shadow-[0_10px_40px_rgba(0,0,0,0.3)] border-2 transition-all duration-300 active:scale-95 text-base sm:text-lg uppercase tracking-wider overflow-hidden ${
              drawingPoints.length >= 3
                ? "bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 active:from-green-800 active:to-green-900 text-white hover:shadow-[0_15px_50px_rgba(22,163,74,0.6)] border-white/30 cursor-pointer hover:scale-[1.02]"
                : "bg-gradient-to-br from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed opacity-60 border-gray-300"
            }`}
          >
            {drawingPoints.length >= 3 && (
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
            <span className="relative flex items-center justify-center gap-2 sm:gap-3">
              <span className="text-xl sm:text-2xl font-bold">✓</span>
              <span className="font-extrabold">
                Confirm{" "}
                {drawingPoints.length >= 3
                  ? ""
                  : `(${3 - drawingPoints.length})`}
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Overlay container spanning map for dialogs (cluster moved separately) */}
      <div className="absolute inset-0 z-[100] pointer-events-none">
        {/* --- ROUTE PLANNING MODAL --- */}
        <Transition appear show={isRoutingPanelOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-[200]"
            onClose={() => setIsRoutingPanelOpen(false)}
          >
            {/* Backdrop - Mobile Only */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="md:hidden fixed inset-0 bg-black/25 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              {/* Mobile: Bottom Sheet / PC: Right Sidebar */}
              <div className="flex min-h-full items-end justify-center md:items-center md:justify-end">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300"
                  enterFrom="translate-y-full md:translate-y-0 md:translate-x-full"
                  enterTo="translate-y-0 md:translate-x-0"
                  leave="transform transition ease-in-out duration-300"
                  leaveFrom="translate-y-0 md:translate-x-0"
                  leaveTo="translate-y-full md:translate-y-0 md:translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-full md:w-96 max-h-[85vh] md:h-screen">
                    <div className="flex h-auto md:h-full flex-col overflow-y-scroll bg-white shadow-xl rounded-t-2xl md:rounded-none">
                      {/* Header */}
                      <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
                        <Dialog.Title className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <Signpost
                            size={24}
                            weight="bold"
                            className="text-red-600"
                          />
                          Route Planning
                        </Dialog.Title>
                        <button
                          onClick={() => setIsRoutingPanelOpen(false)}
                          className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
                        >
                          <X size={24} className="text-gray-600" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 md:p-5 space-y-4 overflow-y-auto pb-safe">
                        {/* Statistics Box */}
                        {routeDuration !== null && (
                          <div className="bg-red-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <Timer
                                size={24}
                                weight="bold"
                                className="text-red-600"
                              />
                              <p className="font-semibold text-gray-900">
                                Travel Time Estimation
                              </p>
                            </div>
                            <div className="flex justify-around text-center">
                              <div>
                                <div className="text-xs text-gray-600">
                                  Est. Travel Time
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatDuration(routeDuration)}
                                </div>
                              </div>
                              <div className="border-l border-gray-300"></div>
                              <div>
                                <div className="text-xs text-gray-600">
                                  Est. Arrival Time
                                </div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {calculateETA(routeDuration)}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Pin Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setPickingMode("start");
                              createDraggablePin("start");
                              setIsRoutingPanelOpen(false);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                              pickingMode === "start"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <Crosshair size={20} weight="bold" />
                            Set Start
                          </button>
                          <button
                            onClick={() => {
                              setPickingMode("end");
                              createDraggablePin("end");
                              setIsRoutingPanelOpen(false);
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                              pickingMode === "end"
                                ? "bg-red-600 text-white"
                                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <MapPin size={20} weight="bold" />
                            Set End
                          </button>
                        </div>

                        {/* Start Point Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <Crosshair size={16} className="text-gray-500" />
                            Start Point
                          </label>
                          <div className="relative">
                            <div
                              onClick={() => {
                                setPickingMode("start");
                                createDraggablePin("start");
                                setIsRoutingPanelOpen(false);
                              }}
                              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-900 cursor-pointer select-none transition-all ${
                                pickingMode === "start"
                                  ? "ring-2 border-red-500 ring-red-500"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {startAddress || "Click to pick on map"}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Latitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={startPoint?.lat ?? ""}
                                onChange={(e) => {
                                  const lat = parseFloat(e.target.value);
                                  if (!isNaN(lat) && startPoint) {
                                    setStartPoint({ ...startPoint, lat });
                                  } else if (!isNaN(lat)) {
                                    setStartPoint({ lat, lng: 0 });
                                  }
                                }}
                                placeholder="14.5995"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Longitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={startPoint?.lng ?? ""}
                                onChange={(e) => {
                                  const lng = parseFloat(e.target.value);
                                  if (!isNaN(lng) && startPoint) {
                                    setStartPoint({ ...startPoint, lng });
                                  } else if (!isNaN(lng)) {
                                    setStartPoint({ lat: 0, lng });
                                  }
                                }}
                                placeholder="120.9842"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* End Point Section */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                            <MapPin size={16} className="text-gray-500" />
                            End Point
                          </label>
                          <div className="relative">
                            <div
                              onClick={() => {
                                setPickingMode("end");
                                createDraggablePin("end");
                                setIsRoutingPanelOpen(false);
                              }}
                              className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-900 cursor-pointer select-none transition-all ${
                                pickingMode === "end"
                                  ? "ring-2 border-red-500 ring-red-500"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {endAddress || "Click to pick on map"}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">
                                Latitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={endPoint?.lat ?? ""}
                                onChange={(e) => {
                                  const lat = parseFloat(e.target.value);
                                  if (!isNaN(lat) && endPoint) {
                                    setEndPoint({ ...endPoint, lat });
                                  } else if (!isNaN(lat)) {
                                    setEndPoint({ lat, lng: 0 });
                                  }
                                }}
                                placeholder="14.5995"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">
                                Longitude
                              </label>
                              <input
                                type="number"
                                step="any"
                                value={endPoint?.lng ?? ""}
                                onChange={(e) => {
                                  const lng = parseFloat(e.target.value);
                                  if (!isNaN(lng) && endPoint) {
                                    setEndPoint({ ...endPoint, lng });
                                  } else if (!isNaN(lng)) {
                                    setEndPoint({ lat: 0, lng });
                                  }
                                }}
                                placeholder="120.9842"
                                className="w-full bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Transport Mode */}
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Car size={18} className="text-gray-400" />
                          </div>
                          <select
                            value={selectedTransportMode}
                            onChange={(e) =>
                              setSelectedTransportMode(e.target.value)
                            }
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer"
                          >
                            <option value="driving-car">Car</option>
                            <option value="cycling-regular">Bicycle</option>
                            <option value="foot-walking">Walking</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Blockages Section - Responders and Admins */}
                        {(mode === "responder" || mode === "admin") && (
                          <div className="space-y-2 bg-orange-50 p-3 rounded-lg border border-orange-200">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-gray-800">
                                🚧 Road Blockages ({blockages.length})
                              </label>
                              <button
                                onClick={() => {
                                  console.log(
                                    "🚧 Add blockage clicked - mode:",
                                    mode
                                  );
                                  console.log(
                                    "🚧 Setting isDrawingBlockage to TRUE"
                                  );
                                  setIsDrawingBlockage(true);
                                  setDrawingPoints([]);
                                  setIsRoutingPanelOpen(false);
                                  console.log(
                                    "🚧 Drawing mode should now be active - buttons should appear"
                                  );
                                }}
                                className="group relative text-xs px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-bold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                                <span className="relative">+ Add Blockage</span>
                              </button>
                            </div>
                            {blockages.length > 0 && (
                              <div className="max-h-32 overflow-y-auto space-y-1 bg-gray-50 rounded-lg p-2">
                                {blockages.map((blockage) => (
                                  <div
                                    key={blockage.id}
                                    className="flex items-center justify-between bg-white rounded px-2 py-1.5 border border-gray-200"
                                  >
                                    <span className="text-xs text-gray-700 truncate flex-1">
                                      {blockage.name}
                                    </span>
                                    <button
                                      onClick={() =>
                                        removeBlockage(blockage.id)
                                      }
                                      className="ml-2 text-red-600 hover:text-white hover:bg-red-600 w-5 h-5 rounded flex items-center justify-center transition-all duration-200 active:scale-90"
                                      title="Remove blockage"
                                    >
                                      <span className="text-base font-bold leading-none">
                                        ×
                                      </span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={clearRoute}
                            className="group relative bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-800 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            <span className="relative">Clear</span>
                          </button>
                          <button
                            onClick={handleGetRoute}
                            disabled={isFetchingRoute}
                            className="group relative bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                            <span className="relative">
                              {isFetchingRoute ? "Routing..." : "Get Route"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Consolidated Bottom-Right Control Cluster (ordered: +, -, 3D/2D, route) */}
        <div className="absolute bottom-4 right-4 z-[110] flex flex-col gap-2 pointer-events-auto">
          {/* Zoom In */}
          <button
            onClick={() => mapRef.current?.zoomIn()}
            title="Zoom In"
            className="bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-full md:rounded-xl p-0.5 md:p-3 transition-all duration-200 w-5 h-5 md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl"
          >
            <Plus size={12} weight="bold" className="text-gray-600 md:hidden" />
            <Plus size={20} weight="bold" className="text-gray-600 hidden md:block" />
          </button>
          {/* Zoom Out */}
          <button
            onClick={() => mapRef.current?.zoomOut()}
            title="Zoom Out"
            className="bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-full md:rounded-xl p-0.5 md:p-3 transition-all duration-200 w-5 h-5 md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl"
          >
            <Minus size={12} weight="bold" className="text-gray-600 md:hidden" />
            <Minus size={20} weight="bold" className="text-gray-600 hidden md:block" />
          </button>
          {/* 3D / 2D Toggle */}
          <button
            onClick={() => {
              if (!mapRef.current) return;
              const map = mapRef.current;
              const currentPitch = map.getPitch();
              const newPitch = currentPitch === 0 ? 60 : 0;
              const newBearing = currentPitch === 0 ? 180 : 0;
              map.easeTo({ pitch: newPitch, bearing: newBearing, duration: 1000 });
              setIs3D(newPitch !== 0);
            }}
            title={is3D ? 'Switch to 2D' : 'Switch to 3D'}
            className="bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl"
          >
            <Globe size={20} weight="bold" className={is3D ? 'text-red-600' : 'text-gray-600'} />
          </button>
          {/* Route Planning Trigger */}
          <button
            onClick={() => setIsRoutingPanelOpen(true)}
            title="Route Planning"
            className="bg-[#E53935] hover:bg-[#D32F2F] text-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-[#E53935] hover:scale-105 active:scale-95 hover:shadow-2xl"
          >
            <Signpost size={20} weight="bold" />
          </button>
        </div>
      </div>

      {/* Current Location Coordinates Display */}
      {showLocationCoords && userLocation && (
        <div className="absolute bottom-28 left-4 z-[100] bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl p-3 md:p-4 pointer-events-auto border border-white/20 max-w-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Crosshair size={20} weight="bold" className="text-red-600" />
                <h3 className="text-sm font-semibold text-gray-900">Current Location</h3>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 w-16">Latitude:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900">{userLocation.lat.toFixed(4)}°</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 w-16">Longitude:</span>
                  <span className="text-sm font-mono font-semibold text-gray-900">{userLocation.lng.toFixed(4)}°</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowLocationCoords(false)}
              className="rounded-lg p-1 hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Close coordinates display"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Route Planning Button moved into control cluster above; removed standalone */}

      {/* Legend - Bottom Right */}
      <div
        className={`absolute bottom-20 right-4 z-[100] w-[calc(100vw-32px)] max-w-xs md:w-80 bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl p-2 md:p-3 pointer-events-auto border border-white/20 ${
          isLegendVisible ? "" : "hidden"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1 md:mb-2">
          <Info size={14} />
          Legend
        </div>
        <div className="text-xs text-gray-500 mb-2">Use buttons above to toggle heatmap and markers</div>
        <div className="space-y-1">
          {/* Enhanced Heatmap Legend */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-2">Combined Risk Assessment</div>
            <div className="space-y-1">
              <div className="w-full h-3 rounded-sm bg-gradient-to-r from-green-400 via-yellow-400 to-red-600 border border-gray-300"></div>
              <div className="flex justify-between text-xs text-gray-600"><span>Low Risk</span><span>High Risk</span></div>
              <div className="text-xs text-gray-500 text-center space-y-1">
                <div>Hazard Intensity × Population Vulnerability</div>
                <div className="text-xs text-blue-600">🔵 Low vulnerability areas</div>
                <div className="text-xs text-red-600">🔴 High vulnerability areas</div>
              </div>
            </div>
          </div>

          {/* Hazard Points Legend */}
          <div className="border-t border-gray-200 pt-2">
            <div className="text-xs font-medium text-gray-600 mb-1">Hazard Points</div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 md:gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div><span className="text-xs text-gray-600">High Risk</span></div>
              <div className="flex items-center gap-1 md:gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div><span className="text-xs text-gray-600">Medium Risk</span></div>
              <div className="flex items-center gap-1 md:gap-2"><div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div><span className="text-xs text-gray-600">Low Risk</span></div>
            </div>
          </div>
        </div>
      </div>

      <ResponderSidebar
        isOpen={isResponderSidebarOpen}
        onClose={() => setIsResponderSidebarOpen(false)}
        pointDocId={selectedPointDocId}
        allResponders={allResponders}
        mode={mode}
        uniqueID={uniqueID}
        pointName={selectedResponderData?.name || "Loading..."}
        selectedRisk={selectedRisk}
      />
    </React.Fragment>
  );
}
