"use client";

import maplibregl, { Popup, Marker } from "maplibre-gl";
// @ts-ignore: side-effect CSS import without type declarations
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, Fragment, useCallback } from "react";
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
  ArrowDown,
  List,
  Signpost,
  Crosshair,
  MapPin,
  Car,
  User,
  CircleNotch, // FIX: Replaced Spinner with CircleNotch
} from "@phosphor-icons/react/dist/ssr";
import { Timer } from "@phosphor-icons/react";
import { truncate } from "fs/promises";

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
  role: "responder" | "admin";
  profilePictureUrl?: string; // Profile picture URL
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
  mode: "user" | "admin";
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
      return;
    }

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
        // Get the feature object for this specific point (e.g., docData["0"])
        const pointFeature = docData?.[pointDocId];

        // --- NEW: Collect ALL assigned UIDs across ALL points ---
        const globalAssignedUIDs: string[] = [];
        Object.entries(docData).forEach(([key, value]: [string, any]) => {
          if (value.type === "Feature" && value.properties?.assignedResponders) {
            globalAssignedUIDs.push(...value.properties.assignedResponders);
          }
        });

        if (pointFeature && pointFeature.properties) {
          // Get the array of UIDs from properties.assignedResponders for THIS point
          const assignedUIDs = pointFeature.properties.assignedResponders || [];

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
        } else {
          // Point feature doesn't have properties yet
          console.warn(`Point ${pointDocId} has no properties in ${documentId}`);
          // Show only responders not assigned to ANY point
          for (const responder of allResponders) {
            if (!globalAssignedUIDs.includes(responder.id)) {
              newAvailable.push(responder);
            }
          }
        }
      } else {
        // Document doesn't exist yet
        console.warn(`Document not found: ${collectionId}/${documentId}`);
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
    return (
      <div className="flex flex-wrap gap-2">
        {list.map((p) => (
          <div
            key={p.id}
            className="pr-1 bg-zinc-900/10 rounded-[40px] flex items-center gap-2 px-2 py-1"
          >
            {/* Profile picture or placeholder avatar */}
            {p.profilePictureUrl ? (
              <img
                src={p.profilePictureUrl}
                alt={p.name}
                className="w-5 h-5 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-5 h-5 bg-zinc-700 rounded-full flex items-center justify-center ${
                p.profilePictureUrl ? "hidden" : ""
              }`}
            >
              <User size={12} className="text-white" />
            </div>
            <div className="flex items-center gap-1">
              <div className="opacity-90 text-[12px] text-[#111827]">
                {p.name}
              </div>
              {/* Only show button if admin */}
              {mode === "admin" && (
                <button
                  onClick={() =>
                    handleAction(p.id, modeAction as "add" | "remove")
                  }
                  className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-[30px] text-[10px] leading-none border border-gray-500/70 text-gray-700 hover:bg-gray-700 hover:text-white transition"
                >
                  {modeAction === "remove" ? "×" : "+"}
                </button>
              )}
            </div>
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
                    <div className="inline-flex items-end gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 relative bg-red-500 rounded-3xl">
                          <div className="w-3 h-0.5 absolute left-[5px] top-[13px] -rotate-45 bg-white"></div>
                        </div>
                        {/* Title now from prop */}
                        <div className="text-[#111827] text-base font-semibold">
                          {pointName || "Loading..."}
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-[12px] text-zinc-900/60">
                      {mode === "admin"
                        ? "Assign or remove responders."
                        : "Viewing assigned responders."}
                    </div>
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
                      {/* Assigned List */}
                      <div className="flex flex-col gap-1">
                        <div className="inline-flex items-center gap-2">
                          <div className="text-red-600 text-[12px] font-semibold">
                            Assigned Responder(s)
                          </div>
                          <div className="w-1 h-1 bg-zinc-900/60 rounded-full"></div>
                          <div className="text-zinc-900/60 text-[12px] font-medium">
                            {assigned.length} Selected
                          </div>
                        </div>
                        <div className="p-3 rounded-lg border border-zinc-900/10 flex flex-col gap-2">
                          <ResponderChipRow
                            list={assigned}
                            modeAction={mode === "admin" ? "remove" : "user"}
                          />
                        </div>
                      </div>

                      {/* Available List (Only show in Admin) */}
                      {mode === "admin" && (
                        <div className="flex flex-col gap-1">
                          <div className="inline-flex items-center gap-2">
                            <div className="text-red-600 text-[12px] font-semibold">
                              Available Responder(s)
                            </div>
                            <div className="w-1 h-1 bg-zinc-900/60 rounded-full"></div>
                            <div className="text-zinc-900/60 text-[12px] font-medium">
                              {available.length} Available
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border border-zinc-900/10 flex flex-col gap-2 max-h-60 overflow-y-auto">
                            <ResponderChipRow
                              list={available}
                              modeAction="add"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="mt-2 inline-flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="h-6 px-3 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 text-[12px] font-semibold"
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
  mode?: "user" | "admin"; // --- NEW PROP ---
  uniqueID: string; // --- NEW PROP ---
}) {
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
      "unclustered-point",
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

  // ... (routing functions unchanged: fetchRoute, handleGetRoute, clearRoute, createDraggablePin) ...
  const fetchRoute = async (
    start: { lng: number; lat: number },
    end: { lng: number; lat: number },
    mode: string
  ) => {
    setIsFetchingRoute(true);
    setRouteGeoJSON(null);
    setRouteDuration(null);
    const url = "/api/route";
    const body = JSON.stringify({ start, end, mode });

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
    if (mode === "admin" && uniqueID) {
      console.log(`🔍 Attempting to fetch responders for uniqueID: ${uniqueID}`);

      // Fetch from: uniqueID/responders document (e.g., PH063043000/responders)
      const respondersDocRef = doc(db, uniqueID, "responders");

      const unsubscribe = onSnapshot(
        respondersDocRef,
        (docSnap) => {
          console.log(`📡 Snapshot received for ${uniqueID}/responders`);

          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log(`📦 Document data:`, data);

            // Get the responderList array
            const responderList = data?.responderList || [];
            console.log(`👥 Responder list found:`, responderList);

            // Map the responderList to Person objects
            const responders: Person[] = responderList.map((r: any) => ({
              id: r.uid, // Use uid as the id
              name: r.name,
              email: r.email,
              role: r.role,
              profilePictureUrl: r.profilePictureUrl, // Include profile picture
            }));

            setAllResponders(responders);
            console.log(
              `✅ Successfully set ${responders.length} responders:`,
              responders
            );
          } else {
            console.warn(`⚠️ No responders document found at ${uniqueID}/responders`);
            setAllResponders([]);
          }
        },
        (error) => {
          console.error("❌ Error fetching responders:", error);
          setAllResponders([]);
        }
      );

      return () => unsubscribe();
    } else {
      console.log(`⏭️ Skipping responder fetch - mode: ${mode}, uniqueID: ${uniqueID}`);
    }
  }, [mode, uniqueID]); // Re-run if mode or uniqueID changes

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
      "unclustered-point",
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
        if (!map.getLayer("unclustered-point")) {
          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: `${hazard}-risk`,
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": "#11b4da",
              "circle-radius": 4,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff",
            },
          });
        }
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
  }, [
    isMapLoaded,
    selectedRisk,
    riskDatabase,
    isHeatmapEnabled,
    // We removed responsePoints and syncAllResponderLocations
  ]);

  // --- UPDATED: Click Handlers useEffect ---
  // Moved all click handlers here to be registered only once
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const onClusterClick = async (e: maplibregl.MapLayerMouseEvent) => {
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
           <p style="margin: 4px 0; font-size: 12px; color: #666;">Click to zoom in</p>
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
      const features = map.queryRenderedFeatures(e.point, {
        layers: [`${selectedRisk}-risk`, "unclustered-point"],
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
        earthquake: "#36A816",
        flooding: "#0ea5e9",
        landslide: "#f59e0b",
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
  <div style="background:#ffffff;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.15);padding:12px 14px;min-width:280px;max-width:360px;">
    <div style="display:flex;align-items:center;gap:10px;position:relative;">
      <div style="width:28px;height:28px;border-radius:999px;background:${accent};display:flex;align-items:center;justify-content:center;flex:0 0 auto;">
        <div style="width:16px;height:16px;background:#ffffff;mask:url('${iconPath}') center/contain no-repeat;-webkit-mask:url('${iconPath}') center/contain no-repeat;"></div>
      </div>
      <div style="flex:1 1 auto;">
        <div style="font-weight:700;font-size:15px;line-height:1.2;">${hazardTitle}</div>
        <div style="font-size:12px;color:#6b7280;">Calculated by Hazard and Population Data</div>
      </div>
      <button class="emerge-popup-close" aria-label="Close" style="cursor:pointer;width:22px;height:22px;border:none;outline:none;border-radius:999px;background:#f3f4f6;color:#6b7280;display:flex;align-items:center;justify-content:center;font-size:14px;position:absolute;right:0;top:0;">×</button>
    </div>
    <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
      <div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Severity</div>
        <div style="font-weight:600;color:${accent};">${toPercent(
        riskScore
      )}</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
      </div>
      <div>
        <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Location</div>
        <div style="font-weight:600;color:${accent};">${barangay}</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
      </div>
      <div style="grid-column:1 / span 1;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Coordinates</div>
        <div style="font-weight:600;color:${accent};">${
        displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"
      }</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
      </div>
      <div style="grid-column:2 / span 1;">
        <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Population</div>
        <div style="font-weight:600;color:${accent};">${
        population ? population.toLocaleString() : "N/A"
      }</div>
        <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
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

      setSelectedPointDocId(docId);
      setSelectedResponderData(properties); // This contains the name
      setIsResponderSidebarOpen(true);

      try {
        document
          .querySelectorAll(".maplibregl-popup")
          .forEach((el) => el.remove());
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
      } catch {}

      map.flyTo({
        center: lngLat,
        zoom: 14,
        padding: { top: 100, right: 400, bottom: 40, left: 40 },
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
    map.on("click", "unclustered-point", onRiskClick);
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
      map.off("click", "unclustered-point", onRiskClick);
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
  }, [isMapLoaded, selectedRisk, pickingMode, startPin, endPin]); // Dependencies for click handlers

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
    <>
      <div className="relative w-full h-[100vh] md:h-[100vh] z-0 rounded-xl shadow-lg">
        {/* Map container */}
        <div id="map" className="w-full h-full" />

        {/* Scroll button */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <button
            type="button"
            aria-label="Scroll to bottom"
            title="Scroll to bottom"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({
                  top: document.body.scrollHeight,
                  behavior: "smooth",
                });
              }
            }}
            className="pointer-events-auto inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-red-600 shadow-lg border border-gray-200 hover:bg-red-50 active:scale-95 transition ring-1 ring-red-200"
          >
            <ArrowDown size={22} weight="bold" />
          </button>
        </div>
      </div>

      {/* Settings Sidebar */}
      <div className="absolute bottom-10 left-5 z-[110] pointer-events-auto">
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

      {/* Top Left (Search/Back) */}
      <div className="absolute top-2 md:top-4 left-2 md:left-18 z-[100] pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Back button */}
          <Link
            href="/"
            aria-label="Back to Home"
            className="pointer-events-auto"
          >
            <span className="inline-flex items-center justify-center bg-white text-red-600 rounded-full w-7 h-7 md:w-12 md:h-12 shadow border border-gray-200 hover:bg-red-50 active:scale-95 transition">
              <ArrowLeft size={16} weight="bold" />
            </span>
          </Link>

          {/* Search box */}
          <div className="bg-white/90 backdrop-blur-md rounded-lg md:rounded-[40] shadow-xl pl-2 pr-1 md:p-3 md:pr-2 max-w-[calc(100vw-100px)] md:max-w-md pointer-events-auto border border-white/20 md:w-80 md:h-12 flex items-center">
            <div className="flex items-center gap-1 md:gap-4 w-full h-full">
              <input
                type="text"
                className="flex-1 bg-transparent outline-none text-xs md:text-sm text-black max-w-2xl"
                placeholder="Search locations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && onSearchSubmit()}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-black min-w-[10px] min-h-[24px] flex items-center justify-center mr-0 pr-0"
                  style={{ marginRight: 0, paddingRight: 0 }}
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={onSearchSubmit}
                disabled={isSearching}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full p-1 md:p-2 transition-colors md:min-w-[36px] md:min-h-[36px] flex items-center justify-center ml-2 md:ml-4 mr-0"
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
      </div>

      {/* Hazard Controls - Top Center */}
      <div className="absolute top-14 md:top-4 left-1/2 mt-5 -translate-x-1/2 z-[105] pointer-events-none">
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          {[
            {
              id: "flooding",
              label: "Flood",
              color: "#0ea5e9",
              icon: "flood icon.svg", // Filename only
            },
            {
              id: "earthquake",
              label: "Earthquake",
              color: "#36A816",
              icon: "earthquake icon.svg", // Filename only
            },
            {
              id: "landslide",
              label: "Landslide",
              color: "#f59e0b",
              icon: "landslide icon.svg", // Filename only
            },
          ].map((h) => {
            const active = selectedRisk === h.id;
            return (
              <button
                key={h.id}
                onClick={() => onHazardChange(h.id)}
                className={`group inline-flex items-center gap-2 rounded-full px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium transition shadow ${
                  active
                    ? "text-white"
                    : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50"
                }`}
                style={active ? { background: h.color } : undefined}
                title={`${h.label} Hazard`}
              >
                <span
                  aria-hidden
                  className="w-4 h-4"
                  style={{
                    background: active ? "#ffffff" : "#6b7280",
                    // FIX: Absolute path
                    WebkitMask: `url('/icons/${h.icon}') center/contain no-repeat`,
                    mask: `url('/icons/${h.icon}') center/contain no-repeat`,
                    display: "inline-block",
                  }}
                />
                <span className="hidden sm:inline">{h.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right-side Controls */}
      <div className="absolute flex flex-col-reverse md:flex-row gap-2 top-2 md:top-4 right-2 transform z-[100] pointer-events-none">
        {/* --- ROUTING PANEL & STATS --- */}
        <div className="pointer-events-auto">
          {isRoutingPanelOpen && (
            <>
              {/* --- STATISTICS BOX --- */}
              {routeDuration !== null && (
                <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-3 max-w-sm md:max-w-md pointer-events-auto border border-white/20 md:w-full mb-2">
                  <div className="flex my-4">
                    <div className="text-red-500 text-xl font-bold items-center flex justify-around gap-2 m-auto">
                      <Timer size={30} weight="bold" />
                      <p className="m-auto">Travel Time Estimation</p>
                    </div>
                  </div>
                  <div className="flex justify-around text-center">
                    <div>
                      <div className="text-xs text-gray-600">
                        Est. Travel Time
                      </div>
                      <div className="text-lg font-semibold text-black">
                        {formatDuration(routeDuration)}
                      </div>
                    </div>
                    <div className="border-l border-gray-200"></div>{" "}
                    {/* Vertical divider */}
                    <div>
                      <div className="text-xs text-gray-600">
                        Est. Arrival Time
                      </div>
                      <div className="text-lg font-semibold text-black">
                        {calculateETA(routeDuration)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- ROUTING PANEL --- */}
              <div className="flex flex-col md:flex-row gap-2">
                {/* Pin buttons */}
                <div className="pointer-events-auto flex flex-row md:flex-col gap-1 md:gap-2">
                  <button
                    onClick={() => {
                      setPickingMode("start");
                      createDraggablePin("start");
                    }}
                    className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border hover:scale-105 active:scale-95 ${
                      pickingMode == "start"
                        ? "border-red-500 text-red-600"
                        : "border-white/20 text-gray-600"
                    }`}
                    title="Set Start Pin"
                  >
                    <Crosshair size={20} weight="bold" />
                  </button>
                  <button
                    onClick={() => {
                      setPickingMode("end");
                      createDraggablePin("end");
                    }}
                    className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border hover:scale-105 active:scale-95 ${
                      pickingMode == "end"
                        ? "border-red-500 text-red-600"
                        : "border-white/20 text-gray-600"
                    }`}
                    title="Set End Pin"
                  >
                    <MapPin size={20} weight="bold" />
                  </button>
                </div>
                {/* Panel content */}
                <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-xl p-3 max-w-sm md:max-w-md pointer-events-auto border border-white/20 md:w-80">
                  <h3 className="text-md font-semibold text-gray-900 mb-3">
                    Route Planning
                  </h3>

                  <div className="flex flex-col gap-2">
                    {/* Start Point */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Crosshair size={18} className="text-gray-400" />
                      </div>
                      <div
                        onClick={() => {
                          console.log("Start clicked!");
                          setPickingMode("start");
                        }}
                        className={`flex-1 w-full bg-gray-50 border rounded-lg px-2 py-2 pl-10 text-sm text-gray-900 cursor-pointer select-none ${
                          pickingMode == "start"
                            ? "ring-2 border-red-500 ring-red-500"
                            : "border-gray-200"
                        }`}
                      >
                        {startAddress || "Click Pin to Set Start"}
                      </div>
                    </div>

                    {/* End Point */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <MapPin size={18} className="text-gray-400" />
                      </div>
                      <div
                        onClick={() => {
                          console.log("End clicked!");
                          setPickingMode("end");
                        }}
                        className={`flex-1 w-full bg-gray-50 border rounded-lg px-2 py-2 pl-10 text-sm text-gray-900 cursor-pointer select-none ${
                          isPickingEnd
                            ? "ring-2 border-red-500 ring-red-500"
                            : "border-gray-200"
                        }`}
                      >
                        {endAddress || "Click Pin or Responder"}
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
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none"
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
                          xmlns="http://www.w3.org/2000/svg"
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

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={clearRoute}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 text-sm font-medium rounded-lg transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleGetRoute}
                        disabled={isFetchingRoute}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isFetchingRoute ? "Routing..." : "Get Route"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Map Control Button Cluster */}
        <div className="flex flex-col gap-1 md:gap-2 pointer-events-auto">
          {/* Zoom In Button */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomIn();
              }
            }}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl`}
            title="Zoom In"
          >
            <Plus size={20} weight="bold" className="text-gray-600" />
          </button>
          {/* Zoom Out Button */}
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.zoomOut();
              }
            }}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl`}
            title="Zoom Out"
          >
            <Minus size={20} weight="bold" className="text-gray-600" />
          </button>
          <button
            onClick={() => setIsRoutingPanelOpen((o) => !o)}
            aria-label="Toggle Route Planning"
            title="Route Planning"
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl ${
              isRoutingPanelOpen ? "bg-red-100 text-red-700" : "text-gray-600"
            }`}
          >
            <Signpost size={20} weight="bold" />
          </button>
          {/* --- MY LOCATION BUTTON --- */}
          <button
            onClick={onGetCurrentLocation}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl`}
            title="My Location"
          >
            <Crosshair size={20} weight="bold" className="text-gray-600" />
          </button>
          <button
            onClick={() => {
              if (!mapRef.current) return;
              const map = mapRef.current;
              const currentPitch = map.getPitch();
              const newPitch = currentPitch === 0 ? 60 : 0;
              const newBearing = currentPitch === 0 ? 180 : 0;
              map.easeTo({
                pitch: newPitch,
                bearing: newBearing,
                duration: 1000,
              });
              setIs3D(newPitch !== 0);
            }}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl
            `}
          >
            <Globe
              size={20}
              weight="bold"
              className={is3D ? "text-red-600" : "text-gray-600"}
            />
          </button>{" "}
        </div>
      </div>

      {/* Legend - Bottom Right */}
      <div
        className={`absolute bottom-4 right-4 z-[100] w-[calc(100vw-32px)] max-w-xs md:w-80 bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl p-2 md:p-3 pointer-events-auto border border-white/20 ${
          isLegendVisible ? "" : "hidden"
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1 md:mb-2">
          <Info size={14} />
          Legend
        </div>
        <div className="text-xs text-gray-500 mb-2">
          Use buttons above to toggle heatmap and markers
        </div>
        <div className="space-y-1">
          {/* Enhanced Heatmap Legend */}
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-600 mb-2">
              Combined Risk Assessment
            </div>
            <div className="space-y-1">
              {/* Color gradient bar */}
              <div className="w-full h-3 rounded-sm bg-gradient-to-r from-green-400 via-yellow-400 to-red-600 border border-gray-300"></div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Low Risk</span>
                <span>High Risk</span>
              </div>
              <div className="text-xs text-gray-500 text-center space-y-1">
                <div>Hazard Intensity × Population Vulnerability</div>
                <div className="text-xs text-blue-600">
                  🔵 Low vulnerability areas
                </div>
                <div className="text-xs text-red-600">
                  🔴 High vulnerability areas
                </div>
              </div>
            </div>
          </div>

          {/* Hazard Points Legend */}
          <div className="border-t border-gray-200 pt-2">
            <div className="text-xs font-medium text-gray-600 mb-1">
              Hazard Points
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-600">High Risk</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Medium Risk</span>
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="w-2 h-2 md:w-3 md:h-3 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-600">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- RENDER THE NEW SIDEBAR --- */}
      <ResponderSidebar
        isOpen={isResponderSidebarOpen}
        onClose={() => setIsResponderSidebarOpen(false)}
        pointDocId={selectedPointDocId}
        allResponders={allResponders}
        mode={mode} // Pass the map's mode down
        uniqueID={uniqueID} // Pass the collection ID
        pointName={selectedResponderData?.name || "Loading..."} // Pass the name
        selectedRisk={selectedRisk} // Pass the current risk
      />
    </>
  );
}
