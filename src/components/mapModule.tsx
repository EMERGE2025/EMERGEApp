"use client";

import maplibregl, { Popup, Marker } from "maplibre-gl";
// @ts-ignore: side-effect CSS import without type declarations
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, Fragment } from "react"; // <-- Added Fragment
import Link from "next/link";
import { Menu, Transition, Dialog } from "@headlessui/react"; // <-- Added Transition, Dialog
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
} from "@phosphor-icons/react/dist/ssr";
import { Timer } from "@phosphor-icons/react";
import { truncate } from "fs/promises";

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

// const RotateControl = () => { ... };

type GJ = GeoJSON.FeatureCollection | GeoJSON.Feature | string;

interface BoundaryEntry {
  id: "boundary";
  boundary: GJ;
}

interface HazardEntry {
  id: "flooding" | "landslide" | "all_risk" | (string & {});
  risk: GJ;
  responderRange?: GJ;
  responderLocation?: GJ;
}

// --- NEW RESPONDER SIDEBAR COMPONENT ---

type Person = { id: string; name: string };

const FALLBACK_SELECTED: Person[] = [
  { id: "r1", name: "Mauricio Manuel Bergancia" },
  { id: "r2", name: "Michael Rey Tuando" },
  { id: "r3", name: "Mherlie Joy Chavez" },
  { id: "r4", name: "Gillie Calanuga" },
  { id: "r5", name: "Dhominick John Billena" },
  { id: "r6", name: "Mherlie Chavez" },
];
const FALLBACK_AVAILABLE: Person[] = [
  { id: "r7", name: "Mauricio Bergancia" },
  { id: "r8", name: "Michael Rey Tuando" },
  { id: "r9", name: "Mherlie Chavez" },
  { id: "r10", name: "Gillie Calanuga" },
  { id: "r11", name: "Dhominick John Billena" },
  { id: "r12", name: "John Doe" },
];

/**
 * Renders a single row of responder chips (React Component)
 */
function ResponderChipRow({
  list,
  mode,
  onAction,
}: {
  list: Person[];
  mode: "remove" | "add";
  onAction: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((p) => (
        <div
          key={p.id}
          className="pr-1 bg-zinc-900/10 rounded-[40px] flex items-center gap-2 px-2 py-1"
        >
          <div className="w-5 h-5 bg-zinc-700 rounded-full"></div>
          <div className="flex items-center gap-1">
            <div className="opacity-90 text-[12px] text-[#111827]">
              {p.name}
            </div>
            <button
              data-action={mode}
              data-id={p.id}
              onClick={() => onAction(p.id)}
              className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-[30px] text-[10px] leading-none border border-gray-500/70 text-gray-700 hover:bg-gray-700 hover:text-white transition"
            >
              {mode === "remove" ? "×" : "+"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * The new Responder Sidebar React Component
 */
function ResponderSidebar({
  isOpen,
  onClose,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: any;
}) {
  // Internal state to manage the lists.
  // This state is *reset* every time the `data` prop changes.
  const [selected, setSelected] = useState<Person[]>([]);
  const [available, setAvailable] = useState<Person[]>([]);

  useEffect(() => {
    // When the `data` prop changes (i.e., new responder clicked), reset the state
    // In a real app, we'd use `data.properties.responders` etc.
    // For now, we just use the fallback.
    const initialSelected = data?.properties?.selectedResponders || [
      ...FALLBACK_SELECTED,
    ];
    const initialAvailable = data?.properties?.availableResponders || [
      ...FALLBACK_AVAILABLE,
    ];
    setSelected(initialSelected);
    setAvailable(initialAvailable);
  }, [data]); // This effect is the key.

  const handleAction = (id: string, from: "selected" | "available") => {
    if (from === "selected") {
      // Remove from selected, add to available
      const idx = selected.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const [p] = selected.splice(idx, 1);
        setSelected([...selected]);
        setAvailable([p, ...available]);
      }
    } else {
      // Remove from available, add to selected
      const idx = available.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const [p] = available.splice(idx, 1);
        setAvailable([...available]);
        setSelected([...selected, p]);
      }
    }
  };

  const handleConfirm = () => {
    console.log(
      "Confirmed responders:",
      selected.map((p) => p.name)
    );
    onClose();
  };

  const recCount = selected.length;
  const availCount = available.length;

  // Use HeadlessUI Dialog for accessibility and overlay
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
              {/* This is the JSX conversion of the popup HTML */}
              <div className="relative w-full h-full p-4 bg-[#F7F7F7] shadow-xl flex flex-col gap-2.5">
                <button
                  onClick={onClose}
                  className="emerge-popup-close absolute right-4 top-5 cursor-pointer w-[22px] h-[22px] rounded-full border-0 outline-none bg-[#f3f4f6] text-[#6b7280] flex items-center justify-center text-[14px]"
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
                        <div className="text-[#111827] text-base font-semibold">
                          Responders
                        </div>
                      </div>
                    </div>
                    <div className="w-full text-[12px] text-zinc-900/60">
                      Deploy and See Available Responders
                    </div>
                  </div>

                  <div className="self-stretch h-px border-t border-neutral-800/20"></div>

                  {/* Stats */}
                  <div className="flex flex-col gap-3">
                    <div className="w-full h-3.5 inline-flex items-center gap-5">
                      <div className="text-[12px]">
                        <span className="text-zinc-900/80 font-medium">
                          Recommended:
                        </span>
                        <span className="text-[#111827]"> </span>
                        <span className="text-red-600 font-semibold">
                          {recCount} Responders
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-px border-t border-neutral-800/20"></div>

                    {/* Deploy List */}
                    <div className="flex flex-col gap-1">
                      <div className="inline-flex items-center gap-2">
                        <div className="text-red-600 text-[12px] font-semibold">
                          Deploy Responder(s)
                        </div>
                        <div className="w-1 h-1 bg-zinc-900/60 rounded-full"></div>
                        <div className="text-zinc-900/60 text-[12px] font-medium">
                          {recCount} Selected
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-zinc-900/10 flex flex-col gap-2">
                        <ResponderChipRow
                          list={selected}
                          mode="remove"
                          onAction={(id) => handleAction(id, "selected")}
                        />
                      </div>
                    </div>

                    {/* Available List */}
                    <div className="flex flex-col gap-1">
                      <div className="inline-flex items-center gap-2">
                        <div className="text-red-600 text-[12px] font-semibold">
                          Available Responder(s)
                        </div>
                        <div className="w-1 h-1 bg-zinc-900/60 rounded-full"></div>
                        <div className="text-zinc-900/60 text-[12px] font-medium">
                          {availCount} Available
                        </div>
                      </div>
                      <div className="p-3 rounded-lg border border-zinc-900/10 flex flex-col gap-2">
                        <ResponderChipRow
                          list={available}
                          mode="add"
                          onAction={(id) => handleAction(id, "available")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="mt-2 inline-flex items-center gap-3">
                  <button
                    onClick={handleConfirm}
                    className="emerge-resp-confirm h-6 px-3 py-1 bg-red-600 text-white rounded shadow hover:bg-red-700 text-[12px] font-semibold"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={onClose}
                    className="emerge-resp-close h-6 px-3 py-1 bg-[#F7F7F7] rounded border border-black/10 text-zinc-900/80 text-[12px] font-semibold"
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
}: {
  mapType: mapType;
  selectedRisk: string;
  riskDatabase: Record<string, any>;
  searchLocation?: { lng: number; lat: number } | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit: () => void;
  isSearching: boolean;
  onHazardChange: (hazard: string) => void;
  userLocation: { lng: number; lat: number } | null;
  onGetCurrentLocation: () => void;
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

  // Center the camera so the subject sits near the lower-left corner of the viewport
  const focusPointBottomLeft = (
    mapInstance: maplibregl.Map,
    lngLat: [number, number],
    zoom = 14
  ) => {
    const canvas = mapInstance.getCanvas();
    const safeWidth = canvas?.width || 1280;
    const safeHeight = canvas?.height || 720;

    const padding = {
      top: Math.max(
        0,
        Math.min(Math.max(safeHeight * 0.55, 220), Math.max(safeHeight - 40, 0))
      ),
      right: Math.max(
        0,
        Math.min(Math.max(safeWidth * 0.45, 260), Math.max(safeWidth - 60, 0))
      ),
      bottom: Math.max(
        24,
        Math.min(Math.max(safeHeight * 0.08, 40), Math.max(safeHeight * 0.35, 24))
      ),
      left: Math.max(
        24,
        Math.min(Math.max(safeWidth * 0.08, 40), Math.max(safeWidth * 0.25, 24))
      ),
    } as maplibregl.PaddingOptions;

    mapInstance.flyTo({
      center: lngLat,
      zoom,
      padding,
      essential: true,
    });
  };

  // Center horizontally while keeping the current vertical paddings
  const focusPointHorizontalCenter = (
    mapInstance: maplibregl.Map,
    lngLat: [number, number],
    zoom = 14
  ) => {
    const canvas = mapInstance.getCanvas();
    const safeWidth = canvas?.width || 1280;
    const safeHeight = canvas?.height || 720;

    const verticalTop = Math.max(
      0,
      Math.min(Math.max(safeHeight * 0.55, 220), Math.max(safeHeight - 40, 0))
    );
    const verticalBottom = Math.max(
      24,
      Math.min(Math.max(safeHeight * 0.08, 40), Math.max(safeHeight * 0.35, 24))
    );

    const horizontal = Math.max(24, Math.min(Math.max(safeWidth * 0.1, 40), Math.max(safeWidth * 0.25, 24)));

    mapInstance.flyTo({
      center: lngLat,
      zoom,
      padding: { top: verticalTop, right: horizontal, bottom: verticalBottom, left: horizontal },
      essential: true,
    });
  };

  const applyPopupChrome = (popup: maplibregl.Popup | null) => {
    if (!popup) return;
    try {
      const el = popup.getElement();
      if (!el) return;
      el.style.overflow = "visible";
      el.classList.add("emerge-rounded-popup");

      const content = el.querySelector(
        ".maplibregl-popup-content"
      ) as HTMLElement | null;
      if (content) {
        content.style.padding = "0";
        content.style.background = "transparent";
        content.style.borderRadius = "20px";
        content.style.boxShadow = "none";
        content.style.overflow = "visible";
      }

      const tip = el.querySelector(".maplibregl-popup-tip") as
        | HTMLElement
        | null;
      if (tip) {
        tip.style.display = "none";
      }
    } catch (err) {
      console.warn("Failed to decorate popup chrome", err);
    }
  };

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

  // --- NEW RESPONDER SIDEBAR STATE ---
  const [isResponderSidebarOpen, setIsResponderSidebarOpen] = useState(false);
  const [selectedResponderData, setSelectedResponderData] = useState<
    any | null
  >(null);

  // --- NEW HELPER FUNCTIONS ---
  const formatDuration = (totalSeconds: number) => {
    // ... (rest of the function is unchanged)
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes} min ${seconds} sec`;
  };

  const calculateETA = (totalSeconds: number) => {
    // ... (rest of the function is unchanged)
    const eta = new Date(Date.now() + totalSeconds * 1000);
    return eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const enhanceFeaturesWithVulnerability = (
    features: any[],
    vulnerabilityData: any
  ) => {
    // ... (rest of the function is unchanged)
    return features.map((feature: any) => {
      const coords = feature.geometry.coordinates;
      let vulnerabilityScore = 0.5;

      // If we have population vulnerability data, find the closest vulnerability point
      if (vulnerabilityData && vulnerabilityData.vulnerability) {
        const vulnData =
          typeof vulnerabilityData.vulnerability === "string"
            ? JSON.parse(vulnerabilityData.vulnerability)
            : vulnerabilityData.vulnerability;

        if (vulnData && vulnData.features) {
          // Find closest vulnerability point (simplified - in production you'd use spatial indexing)
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

      // Calculate combined risk score (hazard intensity * population vulnerability)
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

  // Toggle heatmap visibility
  const toggleHeatmap = () => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) {
      console.warn("Cannot toggle heatmap: map or data not ready");
      return;
    }

    const map = mapRef.current;
    const hazard = selectedRisk;
    const heatmapLayerId = `${hazard}-heatmap`;

    console.log(
      `Toggling enhanced vulnerability heatmap for ${hazard}, current state: ${isHeatmapEnabled}`
    );

    if (isHeatmapEnabled) {
      // Hide heatmap
      if (map.getLayer(heatmapLayerId)) {
        map.setLayoutProperty(heatmapLayerId, "visibility", "none");
        console.log(`👁️ Hidden grid heatmap: ${heatmapLayerId}`);
      } else {
        console.log(
          `⚠️ Tried to hide ${heatmapLayerId} but layer doesn't exist`
        );
      }
      setIsHeatmapEnabled(false);
    } else {
      // Show heatmap
      if (map.getLayer(heatmapLayerId)) {
        map.setLayoutProperty(heatmapLayerId, "visibility", "visible");
        console.log(`👁️ Shown existing grid heatmap: ${heatmapLayerId}`);
      } else {
        // Create heatmap if it doesn't exist
        console.log(`🆕 Creating new grid heatmap for ${hazard}`);
        createHeatmapLayer(hazard);
      }
      setIsHeatmapEnabled(true);
    }
  };

  // Toggle marker visibility
  const toggleMarkers = () => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current) {
      console.warn("Cannot toggle markers: map not ready");
      return;
    }

    const map = mapRef.current;
    const hazard = selectedRisk;

    console.log(
      `📍 Toggling markers for ${hazard}, current state: ${areMarkersVisible}`
    );

    // Layer IDs to toggle
    const markerLayers = [
      `${hazard}-risk`,
      "responderLocation",
      "clusters",
      "cluster-count",
      "unclustered-point",
    ];

    if (areMarkersVisible) {
      // Hide markers
      markerLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "none");
          console.log(`👁️ Hidden marker layer: ${layerId}`);
        }
      });
      setAreMarkersVisible(false);
    } else {
      // Show markers
      markerLayers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", "visible");
          console.log(`👁️ Shown marker layer: ${layerId}`);
        }
      });
      setAreMarkersVisible(true);
    }
  };

  // Create enhanced density-based heatmap with population vulnerability
  const createHeatmapLayer = (hazard: string) => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current || !riskDatabase) {
      console.error("Map or risk database not available");
      return;
    }

    const map = mapRef.current;
    console.log(
      "Creating enhanced vulnerability heatmap with riskDatabase:",
      riskDatabase.map((d: any) => d.id)
    );

    const riskData = riskDatabase.find(
      (d: { id: string }) => d.id === hazard
    ) as HazardEntry;

    // Get population vulnerability data
    const vulnerabilityData = riskDatabase.find(
      (d: any) => d.id === "population_vulnerability"
    ) as any;

    console.log(`Risk data for ${hazard}:`, riskData);
    console.log(`Population vulnerability data:`, vulnerabilityData);

    if (!riskData || !riskData.risk) {
      console.error(`No risk data found for ${hazard}`);
      return;
    }

    const heatmapLayerId = `${hazard}-heatmap`;
    const heatmapSourceId = `${hazard}-heatmap-source`;

    try {
      // Parse hazard data
      const hazardGeoJSON =
        typeof riskData.risk === "string"
          ? JSON.parse(riskData.risk)
          : riskData.risk;

      console.log(`Creating enhanced vulnerability heatmap for ${hazard}`);
      console.log(`Hazard points: ${hazardGeoJSON.features?.length || 0}`);
      console.log(
        `👥 Population vulnerability data available:`,
        !!vulnerabilityData
      );

      if (!hazardGeoJSON.features || hazardGeoJSON.features.length === 0) {
        console.error("No hazard features found");
        return;
      }

      // Enhance hazard data with population vulnerability
      const enhancedFeatures = enhanceFeaturesWithVulnerability(
        hazardGeoJSON.features,
        vulnerabilityData
      );

      const enhancedGeoJSON = {
        ...hazardGeoJSON,
        features: enhancedFeatures,
      };

      console.log(
        `📈 Enhanced ${enhancedFeatures.length} features with vulnerability data`
      );
      console.log(`🎯 Combined risk scores calculated`);
      console.log(
        `📊 Sample combined risk scores:`,
        enhancedFeatures.slice(0, 3).map((f: any) => ({
          hazard: f.properties.originalRiskScore,
          vulnerability: f.properties.vulnerabilityScore,
          combined: f.properties.combinedRiskScore,
        }))
      );

      // Remove existing layers if they exist
      if (map.getLayer(heatmapLayerId)) {
        map.removeLayer(heatmapLayerId);
        console.log("Removed existing heatmap layer");
      }
      if (map.getSource(heatmapSourceId)) {
        map.removeSource(heatmapSourceId);
        console.log("Removed existing heatmap source");
      }

      // Add heatmap source with enhanced data
      map.addSource(heatmapSourceId, {
        type: "geojson",
        data: enhancedGeoJSON,
      });
      console.log("Added enhanced heatmap source");

      // Find the right position to insert layer
      const layers = map.getStyle().layers || [];
      let insertBeforeLayer = undefined;

      // Place before hazard markers for better visibility
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

      console.log(
        "Inserting enhanced heatmap layer before:",
        insertBeforeLayer
      );

      // Add enhanced density heatmap layer
      map.addLayer(
        {
          id: heatmapLayerId,
          type: "heatmap",
          source: heatmapSourceId,
          maxzoom: 18,
          paint: {
            // Weight based on combined risk score (hazard * vulnerability)
            "heatmap-weight": [
              "interpolate",
              ["linear"],
              ["get", "combinedRiskScore"],
              0,
              0,
              0.1,
              0.1,
              0.25,
              0.25,
              0.5,
              0.5,
              0.75,
              0.75,
              1,
              1,
            ],
            // Intensity increases with zoom level
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
            // Enhanced color gradient for combined risk assessment
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(34,197,94,0)", // No risk - transparent green
              0.1,
              "rgba(34,197,94,0.4)", // Very low - light green
              0.2,
              "rgba(34,197,94,0.6)", // Low - green
              0.3,
              "rgba(251,191,36,0.6)", // Low-medium - yellow
              0.4,
              "rgba(251,191,36,0.7)", // Medium - yellow
              0.5,
              "rgba(245,158,11,0.8)", // Medium-high - orange
              0.6,
              "rgba(239,68,68,0.8)", // High - red
              0.7,
              "rgba(220,38,38,0.9)", // Very high - dark red
              0.8,
              "rgba(185,28,28,0.9)", // Critical - darker red
              0.9,
              "rgba(153,27,27,0.95)", // Extreme - very dark red
              1,
              "rgba(127,29,29,1)", // Maximum - darkest red
            ],
            // Radius adjusts with zoom for optimal viewing
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
            // Opacity for smooth transitions
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

      console.log(`✅ Created enhanced vulnerability heatmap for ${hazard}`);
      console.log(
        "Available layers:",
        map.getStyle().layers.map((l: any) => l.id)
      );

      // Log data structure expectations
      if (!vulnerabilityData) {
        console.log(
          `No population vulnerability data found. To enable enhanced risk assessment, add data with id: "population_vulnerability"`
        );
        console.log(
          `Expected structure: { id: "population_vulnerability", vulnerability: GeoJSON with features having properties.vulnerabilityIndex (0-1) }`
        );
      }

      // Test if layer was added successfully
      setTimeout(() => {
        const layerExists = map.getLayer(heatmapLayerId);
        const sourceExists = map.getSource(heatmapSourceId);
        console.log(`Layer ${heatmapLayerId} exists:`, !!layerExists);
        console.log(`Source ${heatmapSourceId} exists:`, !!sourceExists);

        if (layerExists) {
          console.log(
            "Layer visibility:",
            map.getLayoutProperty(heatmapLayerId, "visibility")
          );
        }
      }, 1000);
    } catch (error) {
      console.error(
        `❌ Error creating enhanced vulnerability heatmap for ${hazard}:`,
        error
      );
    }
  };

  // --- ROUTING FUNCTIONS ---

  /**
   * Fetches a route from our *local* API route
   */
  const fetchRoute = async (
    start: { lng: number; lat: number },
    end: { lng: number; lat: number },
    mode: string
  ) => {
    // ... (rest of the function is unchanged)
    setIsFetchingRoute(true);
    setRouteGeoJSON(null); // Clear old route
    setRouteDuration(null); // <-- NEW: Clear old duration

    // This URL is now our *own* Next.js API route
    const url = "/api/route";

    // The body MUST match what your API route (route.ts) expects
    const body = JSON.stringify({
      start, // The start object
      end, // The end object
      mode, // The mode string
    });

    console.log("--- Calling local API /api/route ---");
    console.log("Mode:", mode);
    console.log("Start:", start);
    console.log("End:", end);

    try {
      // Call your local /api/route endpoint
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body, // Send the correct body
      });

      const data = await response.json();

      if (!response.ok) {
        // This will show errors from your API route
        throw new Error(data.error || "Failed to fetch route");
      }

      console.log("Local Route Response:", data);
      setRouteGeoJSON(data); // Set the route GeoJSON

      // --- NEW: Extract and set route statistics ---
      if (
        data.features &&
        data.features[0] &&
        data.features[0].properties &&
        data.features[0].properties.summary
      ) {
        const durationInSeconds = data.features[0].properties.summary.duration;
        setRouteDuration(durationInSeconds);
      } else {
        setRouteDuration(null); // No summary found
      }
      // --- END NEW ---
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

  /**
   * Handles the "Get Route" button click
   */
  const handleGetRoute = () => {
    // ... (rest of the function is unchanged)
    let start = startPoint;

    if (!start) {
      if (userLocation) {
        start = userLocation;
        setStartPoint(userLocation);
        setStartAddress("My Location");
      } else {
        alert(
          "Please set a start point. Use 'My Location' or click 'Select on Map'."
        );
        onGetCurrentLocation(); // Try to get it
        return;
      }
    }

    if (!endPoint) {
      alert(
        "Please set an end point. Click 'Select on Map' or a responder icon."
      );
      return;
    }

    // --- DEBUGGING LOGS ---
    console.log("--- Sending to API ---");
    console.log("Start Point:", start);
    console.log("End Point:", endPoint);
    console.log("Mode:", selectedTransportMode);

    fetchRoute(start, endPoint, selectedTransportMode);

    // --- MODIFIED: Pins are no longer removed here ---
    // We just turn off "picking" mode
    setPickingMode(null);
  };

  /**
   * Clears the current route and inputs
   */
  const clearRoute = () => {
    // ... (rest of the function is unchanged)
    setRouteGeoJSON(null);
    setStartPoint(null);
    setEndPoint(null);
    setStartAddress("");
    setEndAddress("");
    setPickingMode(null);
    setRouteDuration(null); // <-- NEW: Clear stats

    if (userLocationMarker) {
      userLocationMarker.remove();
      setUserLocationMarker(null);
    }

    // --- MODIFIED: REMOVE DRAGGABLE PINS ---
    if (startPin) {
      startPin.remove();
      setStartPin(null);
    }
    if (endPin) {
      endPin.remove();
      setEndPin(null);
    }

    // Remove route line from map
    if (mapRef.current) {
      const map = mapRef.current;
      if (map.getLayer("route-line")) map.removeLayer("route-line");
      if (map.getSource("route-source")) map.removeSource("route-source");
    }
  };

  // --- MODIFIED FUNCTION: Spawns draggable marker ---
  // This now only gets called when the user clicks the pin icons
  const createDraggablePin = (mode: "start" | "end") => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current) return;
    const map = mapRef.current;

    const center = map.getCenter();
    const point = { lng: center.lng, lat: center.lat };
    const address = `Coord: ${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}`;

    if (mode === "start") {
      // If pin already exists, just move it
      if (startPin) {
        startPin.setLngLat(center);
        setStartPoint(point);
        setStartAddress(address);
        return; // Don't create a new one
      }

      // Create new start pin
      const newStartPin = new maplibregl.Marker({
        draggable: true,
        color: "#007cff", // Blue
      })
        .setLngLat(center)
        .addTo(map);

      // Update state
      setStartPoint(point);
      setStartAddress(address);

      // Add listener
      newStartPin.on("dragend", () => {
        const lngLat = newStartPin.getLngLat();
        const point = { lng: lngLat.lng, lat: lngLat.lat };
        const address = `Coord: ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(
          4
        )}`;
        setStartPoint(point);
        setStartAddress(address);
      });

      setStartPin(newStartPin); // Store new pin
    } else {
      // mode === 'end'
      // If pin already exists, just move it
      if (endPin) {
        endPin.setLngLat(center);
        setEndPoint(point);
        setEndAddress(address);
        return; // Don't create a new one
      }

      // Create new end pin
      const newEndPin = new maplibregl.Marker({
        draggable: true,
        color: "#c00000", // Red
      })
        .setLngLat(center)
        .addTo(map);

      // Update state
      setEndPoint(point);
      setEndAddress(address);

      // Add listener
      newEndPin.on("dragend", () => {
        const lngLat = newEndPin.getLngLat();
        const point = { lng: lngLat.lng, lat: lngLat.lat };
        const address = `Coord: ${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(
          4
        )}`;
        setEndPoint(point);
        setEndAddress(address);
      });

      setEndPin(newEndPin); // Store new pin
    }
  };

  // --- MAP INITIALIZATION ---
  useEffect(() => {
    // ... (rest of the function is unchanged)
    // Helper to remove any existing MapLibre popups from the DOM
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

    if (!mapRef.current) return;

    map.on("load", () => {
      console.log("Map loaded, waiting for risk database...");
      removeAllPopups();

      const initialHazard = selectedRisk || "flooding";
      map.flyTo({ center: [122.55012452602386, 10.808910380678128], zoom: 14 });
    });

    return () => {
      removeAllPopups();
      map.remove();
    };
  }, []);

  //  Using the refs for mapping

  useEffect(() => {
    // ... (rest of the function is unchanged)
    pickingModeRef.current = pickingMode;
  }, [pickingMode]);

  // ... (useEffect for boundary loading)
  // ... (Omitted for brevity, unchanged)
  // Handle boundary loading separately from hazard switching
  useEffect(() => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) {
      console.log("Boundary loading skipped - map or data not ready", {
        mapReady: !!mapRef.current,
        dataReady: !!(riskDatabase && riskDatabase.length > 0),
      });
      return;
    }

    const map = mapRef.current;
    console.log("🔄 Loading boundary data...");
    console.log("📊 Risk database contents:", riskDatabase);

    const boundary = riskDatabase.find(
      (d: any) => d.id === "boundary"
    ) as BoundaryEntry;

    console.log("🎯 Boundary entry found:", boundary);

    if (!boundary) {
      console.warn("❌ Boundary entry not found in riskDatabase");
      console.log(
        "Available IDs:",
        riskDatabase.map((d: any) => d.id)
      );
      return;
    }

    if (!boundary.boundary) {
      console.warn("❌ Boundary data is empty or undefined");
      return;
    }

    try {
      let boundaryData;
      if (typeof boundary.boundary === "string") {
        boundaryData = JSON.parse(boundary.boundary);
        console.log("✅ Parsed boundary data from string");
      } else {
        boundaryData = boundary.boundary;
        console.log("✅ Using boundary data directly");
      }

      console.log("🎯 Final boundary data:", boundaryData);

      // Check if boundary data is valid GeoJSON
      if (!boundaryData || !boundaryData.type) {
        console.error("❌ Invalid boundary data - missing type property");
        return;
      }

      if (map.getSource("boundary")) {
        const boundarySource = map.getSource(
          "boundary"
        ) as maplibregl.GeoJSONSource;
        boundarySource.setData(boundaryData);
        console.log("🔄 Updated existing boundary source");
      } else {
        map.addSource("boundary", {
          type: "geojson",
          data: boundaryData,
        });
        console.log("➕ Added new boundary source");
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
        console.log("✅ Added boundary layer successfully");
      } else {
        console.log("ℹ️ Boundary layer already exists");
      }
    } catch (error) {
      console.error("❌ Error loading boundary:", error);
      console.error("📄 Boundary data that caused error:", boundary.boundary);
    }
  }, [riskDatabase]);

  // --- Responder Popup Helper Functions ---
  // ... (Omitted, no longer used by click handler)

  // ... (useEffect for initial heatmap)
  // ... (Omitted for brevity, unchanged)
  // Create initial heatmap when data is loaded and heatmap is enabled
  useEffect(() => {
    // ... (rest of the function is unchanged)
    console.log("Initial heatmap effect triggered:", {
      hasMap: !!mapRef.current,
      hasRiskDatabase: !!riskDatabase,
      riskDatabaseLength: riskDatabase?.length,
      isHeatmapEnabled,
      selectedRisk,
    });

    if (
      !mapRef.current ||
      !riskDatabase ||
      riskDatabase.length === 0 ||
      !isHeatmapEnabled
    ) {
      console.log("Skipping initial heatmap creation - conditions not met");
      return;
    }

    const hazard = selectedRisk;
    console.log(
      `🚀 Creating initial enhanced vulnerability heatmap for ${hazard}`
    );
    createHeatmapLayer(hazard);
  }, [riskDatabase, isHeatmapEnabled, selectedRisk]);

  // ... (useEffect for marker visibility)
  // ... (Omitted for brevity, unchanged)
  // Handle marker visibility when hazards change
  useEffect(() => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current || !areMarkersVisible) return;

    const map = mapRef.current;
    const hazard = selectedRisk;

    // Ensure markers are visible for the current hazard
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
        console.log(`✅ Ensured marker layer is visible: ${layerId}`);
      }
    });
  }, [selectedRisk, areMarkersVisible]);

  // --- MODIFIED: useEffect for userLocation (added pin) ---
  useEffect(() => {
    // ... (rest of the function is unchanged)
    if (mapRef.current && userLocation) {
      const map = mapRef.current;

      // --- REMOVE OLD MARKER ---
      if (userLocationMarker) {
        userLocationMarker.remove();
      }

      // --- CREATE NEW MARKER ELEMENT ---
      const markerElement = document.createElement("div");
      markerElement.className = "user-location-marker";
      markerElement.style.width = "24px";
      markerElement.style.height = "24px";
      markerElement.style.borderRadius = "50%";
      markerElement.style.backgroundColor = "#007cff"; // Blue
      markerElement.style.border = "3px solid #ffffff";
      markerElement.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

      // --- CREATE AND ADD NEW MARKER ---
      const newMarker = new maplibregl.Marker({
        element: markerElement,
        anchor: "center",
      })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);

      // --- SAVE MARKER TO STATE ---
      setUserLocationMarker(newMarker);

      // --- EXISTING LOGIC ---
      map.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
      });
      // Set as start point if routing is open
      if (isRoutingPanelOpen || !startPoint) {
        setStartPoint(userLocation);
        setStartAddress("My Location");
      }
    }
  }, [userLocation]); // Only depends on userLocation

  // --- useEffect for drawing route (unchanged) ---
  useEffect(() => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current || !routeGeoJSON) return;

    const map = mapRef.current;
    const routeLayerId = "route-line";
    const routeSourceId = "route-source";

    // Ensure old route is removed
    if (map.getLayer(routeLayerId)) map.removeLayer(routeLayerId);
    if (map.getSource(routeSourceId)) map.removeSource(routeSourceId);

    // Add new route
    map.addSource(routeSourceId, {
      type: "geojson",
      data: routeGeoJSON,
    });

    map.addLayer({
      id: routeLayerId,
      type: "line",
      source: routeSourceId,
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#c00000", // Bright Red
        "line-width": 5,
        "line-opacity": 0.8,
      },
    });

    // Fit map to route bounds
    if (routeGeoJSON.features && routeGeoJSON.features[0].bbox) {
      const bbox = routeGeoJSON.features[0].bbox;
      map.fitBounds(
        [
          [bbox[0], bbox[1]], // minLng, minLat
          [bbox[2], bbox[3]], // maxLng, maxLat
        ],
        {
          padding: 80, // Add padding
          duration: 1000,
        }
      );
    }
  }, [routeGeoJSON]);

  // --- MODIFIED: useEffect for hazard switching ---
  useEffect(() => {
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) return;

    const map = mapRef.current;

    // ... (remove existing layers and sources - unchanged)
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
      "responderLocation",
      "responderRange",
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
      `${currentHazard}-responder`,
      `${currentHazard}-range`,
    ];

    sourcesToRemove.forEach((sourceId) => {
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    });

    // Load new hazard data
    const hazard = selectedRisk;
    // ... (rest of hazard loading, icons, layers... unchanged)
    // ... (Omitted for brevity)
    const riskData = riskDatabase.find(
      (d: { id: string }) => d.id === hazard
    ) as HazardEntry;

    if (!riskData || !riskData.risk) {
      console.warn(`Risk data for ${hazard} not found`);
      return;
    }

    // Add new sources and layers
    try {
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
        const riskSource = map.getSource(
          `${hazard}-risk`
        ) as maplibregl.GeoJSONSource;
        riskSource.setData(riskGeoJSON);
      } else {
        map.addSource(`${hazard}-risk`, {
          type: "geojson",
          data: riskGeoJSON,
          cluster: true,
          clusterMaxZoom: 17,
          clusterRadius: 50,
        });
      }

      // Load hazard icon
      map
        .loadImage(`icons/${hazard}.png`)
        .then((res) => {
          const image = res.data;
          if (!map.hasImage(hazard)) {
            map.addImage(hazard, image);
          }

          // --- FIX: Add guard check ---
          if (!map.getLayer(`${hazard}-risk`)) {
            map.addLayer({
              id: `${hazard}-risk`,
              type: "symbol",
              source: `${hazard}-risk`,
              filter: ["!", ["has", "point_count"]],
              layout: {
                "icon-image": hazard,
                "icon-size": 0.5,
              },
            });
          }
        })
        .catch((error) => {
          console.error("Failed to load hazard image:", error);
        });

      // Add responder data
      if (map.getSource(`${hazard}-responder`)) {
        const responderLoc = map.getSource(
          `${hazard}-responder`
        ) as maplibregl.GeoJSONSource;
        if (riskData.responderLocation) {
          responderLoc.setData(
            typeof riskData.responderLocation === "string"
              ? JSON.parse(riskData.responderLocation)
              : riskData.responderLocation
          );
        }
      } else {
        map.addSource(`${hazard}-responder`, {
          type: "geojson",
          data:
            typeof riskData.responderLocation === "string"
              ? JSON.parse(riskData.responderLocation)
              : riskData.responderLocation,
        });
      }

      map
        .loadImage("icons/responder.png")
        .then((res) => {
          const image = res.data;
          if (!map.hasImage("responder")) {
            map.addImage("responder", image);
          }

          // --- FIX: Add guard check ---
          if (!map.getLayer("responderLocation")) {
            map.addLayer({
              id: "responderLocation",
              type: "symbol",
              source: `${hazard}-responder`,
              layout: {
                "icon-image": "responder",
                "icon-size": 0.5,
              },
            });
          }
        })
        .catch((error) => {
          console.error("Failed to load responder image:", error);
        });

      // Add responder range
      if (map.getSource(`${hazard}-range`)) {
        const responderRange = map.getSource(
          `${hazard}-range`
        ) as maplibregl.GeoJSONSource;
        if (riskData.responderRange) {
          responderRange.setData(
            typeof riskData.responderRange === "string"
              ? JSON.parse(riskData.responderRange)
              : riskData.responderRange
          );
        }
      } else {
        map.addSource(`${hazard}-range`, {
          type: "geojson",
          data:
            typeof riskData.responderRange === "string"
              ? JSON.parse(riskData.responderRange)
              : riskData.responderRange,
        });
      }

      // --- FIX: Add guard check ---
      if (!map.getLayer("responderRange")) {
        map.addLayer({
          id: "responderRange",
          type: "line",
          source: `${hazard}-range`,
          paint: {
            "line-color": "#008000",
            "line-width": 3,
            "line-opacity": 0.35,
          },
        });
      }

      // Add cluster layers
      // --- FIX: Add guard check ---
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

      // --- FIX: Add guard check ---
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

      // --- FIX: Add guard check ---
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

      // ... (map.on('click', 'clusters') - unchanged)
      // ... (Omitted for brevity)
      // Update click handlers
      map.on("click", "clusters", async (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        const clusterFeature = features[0] as ClusterFeature;
        const pointCount = clusterFeature.properties.point_count;
        const clusterLngLat = (clusterFeature.geometry as GeoJSON.Point)
          .coordinates as [number, number];
        console.log("Cluster points:", pointCount);

        // Show popup for cluster
        const popupContent = `
           <div style="padding: 8px; max-width: 200px; color: black;">
             <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 8px 0;">Cluster</h3>
             <p style="margin: 4px 0;"><strong>Points:</strong> ${pointCount}</p>
             <p style="margin: 4px 0; font-size: 12px; color: #666;">Click to zoom in</p>
           </div>
         `;

        // Validate cluster coordinates
        if (
          clusterLngLat[0] < -180 ||
          clusterLngLat[0] > 180 ||
          clusterLngLat[1] < -90 ||
          clusterLngLat[1] > 90
        ) {
          console.error("Invalid cluster coordinates:", clusterLngLat);
          return;
        }

        try {
          const popup = new Popup()
            .setLngLat(clusterLngLat)
            .setHTML(popupContent)
            .addTo(map);
          console.log("Cluster popup added successfully", popup);
        } catch (error) {
          console.error("Error creating cluster popup:", error);
        }

        // Then zoom in
        const clusterId = clusterFeature.properties.cluster_id;
        const source = map.getSource(
          `${hazard}-risk`
        ) as maplibregl.GeoJSONSource & {
          getClusterExpansionZoom: (clusterId: number) => Promise<number>;
        };

        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = (clusterFeature.geometry as GeoJSON.Point)
          .coordinates;
  map.easeTo({ center: coordinates as [number, number], zoom, essential: true });
      });

      // ... (map.on('click', `${hazard}-risk`) - unchanged)
      // ... (Omitted for brevity)
      // Add click handler for unclustered points
      map.on("click", `${hazard}-risk`, (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: [`${hazard}-risk`],
        });
        if (features.length === 0) return;

        const feature = features[0];
        const properties = feature.properties;
        console.log("Pin properties:", properties);

        const barangay = properties?.ADM4_EN || "Unknown";
        const riskScore = properties?.risk_score ?? 0;
        // Try to derive a population value if present
        const populationRaw = (properties?.population ??
          properties?.pop ??
          properties?.POPULATION) as number | string | undefined;
        const population =
          typeof populationRaw === "number"
            ? populationRaw
            : typeof populationRaw === "string"
            ? parseInt(populationRaw.replace(/[^0-9]/g, ""))
            : undefined;

        // Coordinates for display from feature geometry
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

        // Hazard-specific styling and assets
        const hazardNameMap: Record<string, string> = {
          earthquake: "Earthquake Risk",
          flooding: "Flood Risk",
          landslide: "Landslide Risk",
        };
        const hazardTitle =
          hazardNameMap[selectedRisk] || `${selectedRisk} Risk`;
        const accentMap: Record<string, string> = {
          earthquake: "#36A816", // green
          flooding: "#0ea5e9", // blue
          landslide: "#f59e0b", // orange
        };
        const accent = accentMap[selectedRisk] || "#ef4444"; // fallback red
        const iconMap: Record<string, string> = {
          flooding: "/icons/flood icon.svg",
          landslide: "/icons/landslide icon.svg",
          earthquake: "/icons/earthquake icon.svg",
        };
        const iconPath = iconMap[selectedRisk] || `/icons/${selectedRisk}.svg`;

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
  <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#111827;">
    <div style="background:#ffffff;border-radius:20px;box-shadow:0 16px 40px rgba(17,24,39,0.25);padding:20px;min-width:300px;max-width:360px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;flex:1 1 auto;">
          <div style="width:36px;height:36px;border-radius:999px;background:${accent};display:flex;align-items:center;justify-content:center;">
            <div style="width:18px;height:18px;background:#ffffff;mask:url('${iconPath}') center/contain no-repeat;-webkit-mask:url('${iconPath}') center/contain no-repeat;"></div>
          </div>
          <div style="font-weight:700;font-size:18px;line-height:1.1;color:#111827;">${hazardTitle}</div>
        </div>
        <button class="emerge-popup-close" aria-label="Close" style="cursor:pointer;width:28px;height:28px;border:none;outline:none;border-radius:999px;background:#f3f4f6;color:#6b7280;display:inline-flex;align-items:center;justify-content:center;font-size:16px;">×</button>
      </div>

      <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Severity</div>
          <div style="font-weight:600;color:${accent};">${toPercent(
          riskScore
        )}</div>
          <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
      <div style="margin-top:6px;font-size:12px;color:#6b7280;">Calculated by Hazard and Population Data</div>
      <div style="margin-top:18px;border-top:1px solid #e5e7eb;padding-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 24px;">
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Severity</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${toPercent(riskScore)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Location</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${barangay}</span>
        </div>
        <div style="grid-column:1 / span 1;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Coordinates</div>
          <div style="font-weight:600;color:${accent};">${
          displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"
        }</div>
          <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Coordinates</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"}</span>
        </div>
        <div style="grid-column:2 / span 1;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Population</div>
          <div style="font-weight:600;color:${accent};">${
          population ? population.toLocaleString() : "N/A"
        }</div>
          <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Population</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${population ? population.toLocaleString() : "N/A"}</span>
        </div>
      </div>
    </div>
  </div>`;

        // Get coordinates safely
        let lngLat: [number, number] | undefined;
        if (
          feature.geometry.type === "Point" &&
          Array.isArray(feature.geometry.coordinates)
        ) {
          const coords = feature.geometry.coordinates as [number, number];
          lngLat = [coords[0], coords[1]]; // Ensure [lng, lat] format
          console.log("Raw coordinates:", coords);
          console.log("Processed lngLat:", lngLat);

          // Validate coordinates
          if (
            lngLat[0] < -180 ||
            lngLat[0] > 180 ||
            lngLat[1] < -90 ||
            lngLat[1] > 90
          ) {
            console.error("Invalid coordinates:", lngLat);
            return;
          }

          // Handle antimeridian wrap
          while (Math.abs(e.lngLat.lng - lngLat[0]) > 180) {
            lngLat[0] += e.lngLat.lng > lngLat[0] ? 360 : -360;
          }
        }

        console.log("feature geometry:", feature.geometry);
        console.log("Final lngLat:", lngLat);

        if (lngLat) {
          console.log("Popping up!");

          // Remove any existing popups first
          try {
            document
              .querySelectorAll(".maplibregl-popup")
              .forEach((el) => el.remove());
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;
          } catch {}

          // Create and add popup
          try {
            const popup = new maplibregl.Popup({
              offset: [16, -16],
              anchor: "bottom-left",
              closeButton: false,
            })
              .setLngLat(lngLat)
              .setHTML(popupContent)
              .addTo(map);
            applyPopupChrome(popup);
            currentPopupRef.current = popup;
            // Wire up custom close button
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
            map.flyTo({ center: lngLat, zoom: 14, essential: true });
            console.log("Popup added successfully", popup);
          } catch (error) {
            console.error("Error creating popup:", error);
          }
        }
      });

      // ... (map.on('click', 'unclustered-point') - unchanged)
      // ... (Omitted for brevity)
      // Also handle clicks on the circle layer (unclustered-point) which can sit above the symbol layer
      map.on("click", "unclustered-point", (e) => {
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point"],
        });
        if (features.length === 0) return;

        const feature = features[0];
        const properties = feature.properties;
        console.log("Pin properties (circle):", properties);

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
        const hazardTitle =
          hazardNameMap[selectedRisk] || `${selectedRisk} Risk`;
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
        const iconPath = iconMap[selectedRisk] || `/icons/${selectedRisk}.svg`;

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
  <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#111827;">
    <div style="background:#ffffff;border-radius:20px;box-shadow:0 16px 40px rgba(17,24,39,0.25);padding:20px;min-width:300px;max-width:360px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;flex:1 1 auto;">
          <div style="width:36px;height:36px;border-radius:999px;background:${accent};display:flex;align-items:center;justify-content:center;">
            <div style="width:18px;height:18px;background:#ffffff;mask:url('${iconPath}') center/contain no-repeat;-webkit-mask:url('${iconPath}') center/contain no-repeat;"></div>
          </div>
          <div style="font-weight:700;font-size:18px;line-height:1.1;color:#111827;">${hazardTitle}</div>
        </div>
        <button class="emerge-popup-close" aria-label="Close" style="cursor:pointer;width:28px;height:28px;border:none;outline:none;border-radius:999px;background:#f3f4f6;color:#6b7280;display:inline-flex;align-items:center;justify-content:center;font-size:16px;">×</button>
      </div>

      <div style="margin-top:10px;border-top:1px solid #e5e7eb;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;">
        <div>
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Severity</div>
          <div style="font-weight:600;color:${accent};">${toPercent(
          riskScore
        )}</div>
          <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
      <div style="margin-top:6px;font-size:12px;color:#6b7280;">Calculated by Hazard and Population Data</div>
      <div style="margin-top:18px;border-top:1px solid #e5e7eb;padding-top:16px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 24px;">
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Severity</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${toPercent(riskScore)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Location</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${barangay}</span>
        </div>
        <div style="grid-column:1 / span 1;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Coordinates</div>
          <div style="font-weight:600;color:${accent};">${
          displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"
        }</div>
          <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Coordinates</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"}</span>
        </div>
        <div style="grid-column:2 / span 1;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Population</div>
          <div style="font-weight:600;color:${accent};">${
          population ? population.toLocaleString() : "N/A"
        }</div>
          <div style="height:1px;border-top:1px solid #e5e7eb;margin-top:6px;"></div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Population</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${population ? population.toLocaleString() : "N/A"}</span>
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
            currentPopupRef.current = null;

            const popup = new maplibregl.Popup({
              offset: [16, -16],
              anchor: "bottom-left",
              closeButton: false,
            })
              .setLngLat(lngLat)
              .setHTML(popupContent)
              .addTo(map);
            applyPopupChrome(popup);
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
            map.flyTo({ center: lngLat, zoom: 14, essential: true });
          } catch (error) {
            console.error("Error creating popup (circle):", error);
          }
        }
      });

      // ... (map.on('dragstart') - unchanged)
      // ... (Omitted for brevity)
      // Dismiss popups during map interactions to reduce distraction without closing on fly animations
      const dismissEvents = ["dragstart"] as const;
      dismissEvents.forEach((evt) => {
        map.on(evt, () => {
          try {
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;
            document
              .querySelectorAll(".maplibregl-popup")
              .forEach((el) => el.remove());
          } catch {}
        });
      });

      // ... (map.on mouseenter/mouseleave - unchanged)
      // ... (Omitted for brevity)
      // Update mouse events
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      // Add mouse events for unclustered points
      map.on("mouseenter", `${hazard}-risk`, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", `${hazard}-risk`, () => {
        map.getCanvas().style.cursor = "";
      });

      // --- *** MODIFIED: map.on('click', 'responderLocation') *** ---
      map.on("click", "responderLocation", (e) => {
        if (pickingModeRef.current) {
          const mode = pickingModeRef.current;
          const features = map.queryRenderedFeatures(e.point, {
            layers: ["responderLocation"],
          });
          if (!features.length) return;

          const f = features[0];
          if (
            f.geometry.type === "Point" &&
            Array.isArray((f.geometry as any).coordinates)
          ) {
            const c = (f.geometry as any).coordinates as [number, number];
            const point = { lng: c[0], lat: c[1] };
            const address = `Responder Coord: ${point.lat.toFixed(
              4
            )}, ${point.lng.toFixed(4)}`;

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

            setPickingMode(null); // turn off after setting

            e.preventDefault(); // Stop Popup and return null
            return;
          }
        }

        // (It runs if NOT in 'picking' mode)
        const features = map.queryRenderedFeatures(e.point, {
          layers: ["responderLocation"],
        });
        if (!features.length) return;

        // Base position
        let lngLat: [number, number] | undefined;
        const feature = features[0];
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

        // --- NEW LOGIC: SET STATE AND OPEN SIDEBAR ---

        // 1. Set the data for the sidebar
        // We pass the whole feature.properties, and the geometry
        setSelectedResponderData({
          properties: feature.properties,
          geometry: feature.geometry,
        });

        // 2. Open the sidebar
        setIsResponderSidebarOpen(true);

        // 3. Remove any old popups (good hygiene)
        try {
          document
            .querySelectorAll(".maplibregl-popup")
            .forEach((el) => el.remove());
        // Sample data. If feature has properties.responders, prefer those.
        type Person = { id: string; name: string };
        const fallbackSelected: Person[] = [
          { id: "r1", name: "Mauricio Manuel Bergancia" },
          { id: "r2", name: "Michael Rey Tuando" },
          { id: "r3", name: "Mherlie Joy Chavez" },
          { id: "r4", name: "Gillie Calanuga" },
          { id: "r5", name: "Dhominick John Billena" },
          { id: "r6", name: "Anna Freeman" },
          { id: "r7", name: "Isabel Cruz" },
          { id: "r8", name: "Ramon Velasco" },
          { id: "r9", name: "Liza Sarmiento" },
          { id: "r10", name: "Paolo Fernandez" },
          { id: "r11", name: "Kim Santos" },
          { id: "r12", name: "Janelle Uy" },
          { id: "r13", name: "Emil Custodio" },
          { id: "r14", name: "Harold Pineda" },
          { id: "r15", name: "Carla Navarro" },
        ];
        const fallbackAvailable: Person[] = [
          { id: "r16", name: "Ava Del Rosario" },
          { id: "r17", name: "Ivan Bautista" },
          { id: "r18", name: "Joan Reyes" },
          { id: "r19", name: "Leo Fajardo" },
          { id: "r20", name: "Nina Dizon" },
          { id: "r21", name: "Oscar Manalo" },
          { id: "r22", name: "Pia Madrigal" },
          { id: "r23", name: "Quinn Delos Santos" },
          { id: "r24", name: "Rhea Castillo" },
          { id: "r25", name: "Sam Aquino" },
          { id: "r26", name: "Tessa Albino" },
          { id: "r27", name: "Ulysses Dizon" },
          { id: "r28", name: "Val Navarro" },
          { id: "r29", name: "Wena Salvador" },
          { id: "r30", name: "Xian Lozada" },
        ];

        let selected: Person[] = fallbackSelected.slice();
        let available: Person[] = fallbackAvailable.slice();

        const renderChipRow = (list: Person[], mode: "remove" | "add") => {
          return list
            .map((p) => {
              const isAdd = mode === "add";
              const extraAttrs = isAdd
                ? "aria-label=\"Add responder\""
                : "aria-label=\"Remove responder\"";
          const buttonInner = isAdd
            ? `<span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);font-size:12px;font-weight:700;line-height:1;">×</span>`
            : `<span aria-hidden="true" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px;font-weight:700;line-height:1;">×</span>`;
              return `
              <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;background:rgba(17,24,39,0.08);">
                <img src="https://i.pravatar.cc/32?u=${encodeURIComponent(p.id)}" alt="${p.name}" style="width:16px;height:16px;border-radius:50%;object-fit:cover;"/>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="font-size:12px;color:#111827;white-space:nowrap;">${p.name}</span>
                  <button ${extraAttrs} data-action="${mode}" data-id="${p.id}" style="position:relative;width:18px;height:18px;border-radius:999px;border:none;background:#e5e7eb;color:#111827;font-size:12px;line-height:1;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:all 0.15s ease;">${buttonInner}</button>
                </div>
              </div>`;
            })
            .join("");
        };

        const render = () => {
          const recCount = selected.length;
          const availCount = available.length;
          const listContainerStyle = "display:flex;flex-wrap:wrap;gap:6px;align-items:flex-start;max-height:96px;overflow-y:auto;padding-right:4px;";
          return `
          <div style="font-family: Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial; color:#111827;">
            <div style="width:500px;padding:14px 18px;background:#ffffff;border-radius:20px;box-shadow:0 16px 40px rgba(17,24,39,0.2);display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;flex-direction:column;gap:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:999px;background:#dc2626;position:relative;display:flex;align-items:center;justify-content:center;">
                      <div style="position:absolute;width:16px;height:4px;border-radius:999px;background:#ffffff;"></div>
                      <div style="position:absolute;width:4px;height:16px;border-radius:999px;background:#ffffff;"></div>
                    </div>
                    <div style="font-size:18px;font-weight:700;color:#111827;">Responders</div>
                  </div>
                  <button class="emerge-popup-close" aria-label="Close" style="cursor:pointer;width:28px;height:28px;border:none;outline:none;border-radius:999px;background:#e5e7eb;color:#6b7280;display:inline-flex;align-items:center;justify-content:center;font-size:16px;transition:all 0.15s ease;">×</button>
                </div>
                <div style="font-size:12px;color:#6b7280;">Deploy and manage available responders</div>
              </div>
              <div style="height:1px;width:100%;background:rgba(17,24,39,0.08);"></div>
              <div style="display:flex;flex-direction:column;gap:8px;">
                <div style="font-size:12px;color:#6b7280;">Recommended: <span style="color:#dc2626;font-weight:600;">${recCount} Responders</span></div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;align-items-center;gap:8px;">
                    <span style="color:#dc2626;font-size:12px;font-weight:600;">Deploy Responder(s)</span>
                    <span style="width:4px;height:4px;border-radius:999px;background:rgba(17,24,39,0.5);"></span>
                    <span style="font-size:12px;color:#6b7280;">${recCount} Selected</span>
                  </div>
                  <div style="padding:8px;border:1px solid rgba(17,24,39,0.08);border-radius:12px;">
                    <div style="${listContainerStyle}">${renderChipRow(selected, "remove")}</div>
                  </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="color:#dc2626;font-size:12px;font-weight:600;">Available Responder(s)</span>
                    <span style="width:4px;height:4px;border-radius:999px;background:rgba(17,24,39,0.5);"></span>
                    <span style="font-size:12px;color:#6b7280;">${availCount} Available</span>
                  </div>
                  <div style="padding:8px;border:1px solid rgba(17,24,39,0.08);border-radius:12px;">
                    <div style="${listContainerStyle}">${renderChipRow(available, "add")}</div>
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-start;">
                <button class="emerge-resp-confirm" style="padding:8px 16px;background:#dc2626;color:#ffffff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s ease;">Confirm</button>
                <button class="emerge-resp-close" style="padding:8px 16px;background:#e5e7eb;color:#111827;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s ease;">Close</button>
              </div>
            </div>
          </div>`;
        };

        // Remove any existing popups first
        try {
          document.querySelectorAll('.maplibregl-popup').forEach((el) => el.remove());
          currentPopupRef.current?.remove();
          currentPopupRef.current = null;
        } catch {}

        const alignResponderPopup = (popup: maplibregl.Popup) => {
          const alignNow = () => {
            const el = popup.getElement();
            if (!el) return;
            const rect = el.getBoundingClientRect();
            popup.setOffset([28, -rect.height / 2]);
          };
          requestAnimationFrame(alignNow);
          setTimeout(alignNow, 120);
        };

        // 4. Fly to the location, adding padding for the sidebar
        map.flyTo({
          center: lngLat,
          zoom: 14,
          padding: { top: 100, right: 400, bottom: 40, left: 40 }, // Added right padding
        });

        // --- OLD POPUP LOGIC IS REMOVED ---
      });
      // --- *** END OF MODIFIED CLICK HANDLER *** ---
        const bindHandlers = (popup: maplibregl.Popup) => {
          const root = popup.getElement();
          if (!root) return;
          const closeBtn = root.querySelector('.emerge-popup-close') as HTMLElement | null;
          const confirmBtn = root.querySelector('.emerge-resp-confirm') as HTMLElement | null;
          const close2 = root.querySelector('.emerge-resp-close') as HTMLElement | null;

          const rewire = () => {
            popup.setHTML(render());
            applyPopupChrome(popup);
            bindHandlers(popup);
          };

          const applyHoverStyle = (
            button: HTMLElement | null,
            baseBg: string,
            baseColor: string,
            hoverBg: string,
            hoverColor: string,
            extras?: {
              onEnter?: (btn: HTMLElement) => void;
              onLeave?: (btn: HTMLElement) => void;
            }
          ) => {
            if (!button) return;
            button.style.background = baseBg;
            button.style.color = baseColor;
            button.addEventListener('mouseenter', () => {
              button.style.background = hoverBg;
              button.style.color = hoverColor;
              extras?.onEnter?.(button);
            });
            button.addEventListener('mouseleave', () => {
              button.style.background = baseBg;
              button.style.color = baseColor;
              extras?.onLeave?.(button);
            });
            extras?.onLeave?.(button);
          };

          root.querySelectorAll('[data-action="remove"]').forEach((el) => {
            el.addEventListener('click', (ev) => {
              ev.preventDefault(); ev.stopPropagation();
              const id = (ev.currentTarget as HTMLElement).getAttribute('data-id');
              if (!id) return;
              const idx = selected.findIndex((p) => p.id === id);
              if (idx >= 0) {
                const [p] = selected.splice(idx, 1);
                available.unshift(p);
                rewire();
              }
            });
            applyHoverStyle(
              el as HTMLElement,
              '#e5e7eb',
              '#111827',
              '#dc2626',
              '#ffffff'
            );
          });

          root.querySelectorAll('[data-action="add"]').forEach((el) => {
            el.addEventListener('click', (ev) => {
              ev.preventDefault(); ev.stopPropagation();
              const id = (ev.currentTarget as HTMLElement).getAttribute('data-id');
              if (!id) return;
              const idx = available.findIndex((p) => p.id === id);
              if (idx >= 0) {
                const [p] = available.splice(idx, 1);
                selected.push(p);
                rewire();
              }
            });
            applyHoverStyle(
              el as HTMLElement,
              '#e5e7eb',
              '#111827',
              '#dc2626',
              '#ffffff'
            );
          });

          const doClose = () => { popup.remove(); currentPopupRef.current = null; };
          closeBtn?.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); doClose(); });
          close2?.addEventListener('click', (ev) => { ev.preventDefault(); ev.stopPropagation(); doClose(); });
          confirmBtn?.addEventListener('click', (ev) => {
            ev.preventDefault(); ev.stopPropagation();
            console.log('Confirmed responders:', selected.map((p) => p.name));
            doClose();
          });

          applyHoverStyle(closeBtn, '#e5e7eb', '#6b7280', '#dc2626', '#ffffff');
          applyHoverStyle(confirmBtn, '#dc2626', '#ffffff', '#b91c1c', '#ffffff');
          applyHoverStyle(close2, '#e5e7eb', '#111827', '#dc2626', '#ffffff');

          alignResponderPopup(popup);
        };

        try {
          const popup = new maplibregl.Popup({ offset: [0, 0], anchor: 'left', closeButton: false })
            .setLngLat(lngLat)
            .setHTML(render())
            .addTo(map);
          applyPopupChrome(popup);
          currentPopupRef.current = popup;
          bindHandlers(popup);
          // Animate viewport like hazard pins so the popup adjusts to the screen
            focusPointHorizontalCenter(map, lngLat);
        } catch (err) {
          console.error('Failed to render responder popup:', err);
        }
      });

      // Create heatmap layer if heatmap is enabled
      if (isHeatmapEnabled) {
        createHeatmapLayer(hazard);
      }

      setCurrentHazard(selectedRisk);
    } catch (error) {
      console.error("Error switching hazard:", error);
    }
    // --- FIX: Remove unnecessary dependencies ---
  }, [selectedRisk, riskDatabase, isHeatmapEnabled]);

  // ... (useEffect for search location - unchanged)
  // ... (Omitted for brevity)
  // Handle search location zooming
  useEffect(() => {
    // ... (rest of the function is unchanged)
    if (!mapRef.current || !searchLocation) return;

    const map = mapRef.current;
    console.log("Zooming to search location:", searchLocation);

    map.easeTo({
      center: [searchLocation.lng, searchLocation.lat],
      zoom: 15, // Closer zoom for searched locations
      duration: 1000,
    });

    // Add a marker at the searched location
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

    // Remove marker after 5 seconds
    setTimeout(() => {
      marker.remove();
    }, 5000);
  }, [searchLocation]);

  // ... (useEffect for controls visibility - unchanged)
  // ... (Omitted for brevity)
  // Ensure controls remain visible after map loads
  useEffect(() => {
    // ... (rest of the function is unchanged)
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

    // Force visibility after map load
    mapRef.current.on("load", () => {
      setTimeout(ensureControlsVisible, 100);
    });

    // Also ensure visibility on any map interaction
    mapRef.current.on("moveend", ensureControlsVisible);
    mapRef.current.on("zoomend", ensureControlsVisible);
    mapRef.current.on("rotateend", ensureControlsVisible);
  }, []);

  // --- RETURN STATEMENT (UI) ---
  return (
    <>
      <div className="relative w-full h-[100vh] md:h-[100vh] z-0 rounded-xl shadow-lg">
        {/* ... (Map container and scroll button - unchanged) */}
        <div id="map" className="w-full h-full" />
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

      {/* --- MODIFIED: Top Left (Search/Back) --- */}
      {/* Container is pushed right (left-11) on mobile to avoid settings button */}
      <div className="absolute top-2 md:top-4 left-2 md:left-18 z-[100] pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Back button outside the search box */}
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
          {/* Added max-w-[calc(100vw-100px)] to prevent it from overlapping center/right controls */}
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

      {/* --- MODIFIED: Hazard Controls - Top Center --- */}
      {/* Moved down on mobile (top-14) to avoid search bar */}
      <div className="absolute top-14 md:top-4 left-1/2 mt-5 -translate-x-1/2 z-[105] pointer-events-none">
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          {[
            {
              id: "flooding",
              label: "Flood",
              color: "#0ea5e9",
              icon: "/icons/flood icon.svg",
            },
            {
              id: "earthquake",
              label: "Earthquake",
              color: "#36A816",
              icon: "/icons/earthquake icon.svg",
            },
            {
              id: "landslide",
              label: "Landslide",
              color: "#f59e0b",
              icon: "/icons/landslide icon.svg",
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
                    WebkitMask: `url('${h.icon}') center/contain no-repeat`,
                    mask: `url('${h.icon}') center/contain no-repeat`,
                    display: "inline-block",
                  }}
                />
                <span className="hidden sm:inline">{h.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- MODIFIED: Right-side Controls --- */}
      {/* Stacks vertically on mobile (flex-col-reverse) */}
      <div className="absolute flex flex-col-reverse md:flex-row gap-2 top-2 md:top-4 right-2 transform z-[100] pointer-events-none">
        {/* --- ROUTING PANEL & STATS --- */}
        {/* Removed mr-2 */}
        <div className="pointer-events-auto">
          {isRoutingPanelOpen && (
            <>
              {/* --- NEW STATISTICS BOX --- */}
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

              {/* --- EXISTING ROUTING PANEL (WITH FIXES) --- */}
              {/* Changed to flex-col md:flex-row */}
              <div className="flex flex-col md:flex-row gap-2">
                {/* Pin buttons are now flex-row on mobile */}
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
                {/* Panel content width is responsive (max-w-sm) */}
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
                      {/* --- FIX: Use onClick and readOnly --- */}
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
                      {/* --- FIX: Use onClick and readOnly --- */}
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

        {/* This is your new button cluster layout */}
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

      {/* --- MODIFIED: Legend - Bottom Right --- */}
      {/* Fixed positioning and added responsive width */}
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

      <ResponderSidebar
        isOpen={isResponderSidebarOpen}
        onClose={() => setIsResponderSidebarOpen(false)}
        data={selectedResponderData}
      />
    </>
  );
}
