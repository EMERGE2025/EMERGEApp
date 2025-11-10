"use client";

import maplibregl, { Popup } from "maplibre-gl";
// @ts-ignore: side-effect CSS import without type declarations
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "@headlessui/react";
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
} from "@phosphor-icons/react/dist/ssr";

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

// const RotateControl = () => {
//   class Control {
//     _map: maplibregl.Map | undefined;
//     _container!: HTMLElement;

//     onAdd(map: maplibregl.Map) {
//       this._map = map;
//       this._container = document.createElement("div");
//       this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";

//       const button = document.createElement("button");
//       button.className = "maplibregl-ctrl-icon text-black font-bold";
//       button.type = "button";
//       button.title = "Rotate Map";
//       button.innerHTML = "⟳";

//       button.onclick = () => {
//         const currentBearing = map.getBearing();
//         map.easeTo({
//           bearing: currentBearing + 90,
//           duration: 800,
//         });
//       };

//       this._container.appendChild(button);
//       return this._container;
//     }

//     onRemove() {
//       this._container.parentNode?.removeChild(this._container);
//       this._map = undefined;
//     }

//     getDefaultPosition(): maplibregl.ControlPosition {
//       return "top-right";
//     }
//   }
//   return new Control();
// };

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

  // Enhance features with vulnerability data
  const enhanceFeaturesWithVulnerability = (
    features: any[],
    vulnerabilityData: any
  ) => {
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

  // console.log(riskDatabase);

  // console.log(riskDatabase[0].boundary);

  useEffect(() => {
    // Helper to remove any existing MapLibre popups from the DOM
    const removeAllPopups = () => {
      try {
        currentPopupRef.current?.remove();
        currentPopupRef.current = null;
      } catch {}
      try {
        document
          .querySelectorAll('.maplibregl-popup')
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

    // console.log()

    // map.addSource("geojson", {
    //   type: "geojson",
    //   data: geojson,
    //   cluster: true,
    //   clusterMaxZoom: 17,
    //   clusterRadius: 50,
    // });

    // if (map.listImages().includes("marker-icon") == false) {
    //   let image = map.loadImage(`${geojson.type}`);
    // }

    map.dragRotate.enable();

    mapRef.current = map;

    if (!mapRef.current) return;

    map.on("load", () => {
      console.log("Map loaded, waiting for risk database...");
      // Clean any stray popups that might be present from previous sessions/renders
      removeAllPopups();

      // Load initial hazard data (will be updated when riskDatabase becomes available)
      const initialHazard = selectedRisk || "flooding";
      map.flyTo({ center: [122.55012452602386, 10.808910380678128], zoom: 14 });
    });

    // Removed default NavigationControl to use custom buttons
    // map.addControl(RotateControl(), "bottom-right");

    // setTimeout(() => {
    //   const compass = document.querySelector(
    //     ".maplibregl-ctrl-compass"
    //   ) as HTMLButtonElement;

    //   if (compass) {
    //     compass.addEventListener("click", (e) => {
    //       e.preventDefault();
    //       e.stopPropagation();

    //       const is2D = mapRef.current?.getPitch() === 0;

    //       map.easeTo({
    //         pitch: is2D ? 60 : 0,
    //         bearing: is2D ? 180 : 0,
    //         duration: 1000,
    //       });
    //     });
    //   }
    // }, 500);

    return () => {
      // Ensure popups are removed on unmount
      removeAllPopups();
      map.remove();
    };
  }, []);

  // Handle boundary loading separately from hazard switching
  useEffect(() => {
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

  // Create initial heatmap when data is loaded and heatmap is enabled
  useEffect(() => {
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

  // Handle marker visibility when hazards change
  useEffect(() => {
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

  // Handle hazard switching without reloading the map
  useEffect(() => {
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) return;

    const map = mapRef.current;

    // Remove existing hazard layers and sources (but NOT boundary)
    // Also remove any existing popups for a clean state
    try {
      document.querySelectorAll('.maplibregl-popup').forEach((el) => el.remove());
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

          map.addLayer({
            id: "responderLocation",
            type: "symbol",
            source: `${hazard}-responder`,
            layout: {
              "icon-image": "responder",
              "icon-size": 0.5,
            },
          });
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

      map.addLayer({
        id: "responderRange",
        type: "line",
        source: `${hazard}-range`,
        paint: { "line-color": "#008000", "line-width": 3, "line-opacity": 0.35 },
      });

      // Add cluster layers
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
        const populationRaw = (properties?.population ?? properties?.pop ?? properties?.POPULATION) as
          | number
          | string
          | undefined;
        const population = typeof populationRaw === "number"
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
        const hazardTitle = hazardNameMap[selectedRisk] || `${selectedRisk} Risk`;
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
          return isNaN(n) ? String(v ?? "N/A") : `${(n <= 1 ? n * 100 : n).toFixed(2)}%`;
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
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Coordinates</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"}</span>
        </div>
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
              .querySelectorAll('.maplibregl-popup')
              .forEach((el) => el.remove());
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;
          } catch {}

          // Create and add popup
          try {
            const popup = new maplibregl.Popup({ offset: [16, -16], anchor: 'bottom-left', closeButton: false })
              .setLngLat(lngLat)
              .setHTML(popupContent)
              .addTo(map);
            applyPopupChrome(popup);
            currentPopupRef.current = popup;
            // Wire up custom close button
            const el = popup.getElement();
            const closeBtn = el?.querySelector('.emerge-popup-close') as HTMLElement | null;
            if (closeBtn) {
              closeBtn.addEventListener('click', (ev) => {
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
        const populationRaw = (properties?.population ?? properties?.pop ?? properties?.POPULATION) as number | string | undefined;
        const population = typeof populationRaw === "number" ? populationRaw : typeof populationRaw === "string" ? parseInt(populationRaw.replace(/[^0-9]/g, "")) : undefined;

        let displayLng: string | null = null;
        let displayLat: string | null = null;
        if (feature.geometry.type === "Point" && Array.isArray((feature.geometry as any).coordinates)) {
          const c = (feature.geometry as any).coordinates as [number, number];
          displayLng = typeof c[0] === "number" ? c[0].toFixed(5) : null;
          displayLat = typeof c[1] === "number" ? c[1].toFixed(5) : null;
        }

        const hazardNameMap: Record<string, string> = { earthquake: "Earthquake Risk", flooding: "Flood Risk", landslide: "Landslide Risk" };
        const hazardTitle = hazardNameMap[selectedRisk] || `${selectedRisk} Risk`;
  const accentMap: Record<string, string> = { earthquake: "#36A816", flooding: "#0ea5e9", landslide: "#f59e0b" };
        const accent = accentMap[selectedRisk] || "#ef4444";
        const iconMap: Record<string, string> = { flooding: "/icons/flood icon.svg", landslide: "/icons/landslide icon.svg", earthquake: "/icons/earthquake icon.svg" };
        const iconPath = iconMap[selectedRisk] || `/icons/${selectedRisk}.svg`;

        const toPercent = (v: any) => {
          if (typeof v === "number") {
            const p = v <= 1 ? v * 100 : v;
            return `${p.toFixed(2)}%`;
          }
          const n = Number(v);
          return isNaN(n) ? String(v ?? "N/A") : `${(n <= 1 ? n * 100 : n).toFixed(2)}%`;
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
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Coordinates</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${displayLat && displayLng ? `${displayLat}, ${displayLng}` : "N/A"}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;color:#6b7280;">Population</span>
          <span style="font-size:16px;font-weight:600;color:${accent};">${population ? population.toLocaleString() : "N/A"}</span>
        </div>
      </div>
    </div>
  </div>`;

        let lngLat: [number, number] | undefined;
        if (feature.geometry.type === "Point" && Array.isArray(feature.geometry.coordinates)) {
          const coords = feature.geometry.coordinates as [number, number];
          lngLat = [coords[0], coords[1]];
          while (Math.abs(e.lngLat.lng - lngLat[0]) > 180) {
            lngLat[0] += e.lngLat.lng > lngLat[0] ? 360 : -360;
          }
        }

        if (lngLat) {
          try {
            document.querySelectorAll('.maplibregl-popup').forEach((el) => el.remove());
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;

            const popup = new maplibregl.Popup({ offset: [16, -16], anchor: 'bottom-left', closeButton: false })
              .setLngLat(lngLat)
              .setHTML(popupContent)
              .addTo(map);
            applyPopupChrome(popup);
            currentPopupRef.current = popup;
            const el = popup.getElement();
            const closeBtn = el?.querySelector('.emerge-popup-close') as HTMLElement | null;
            if (closeBtn) {
              closeBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                popup.remove();
                currentPopupRef.current = null;
              });
            }
            map.flyTo({ center: lngLat, zoom: 14, essential: true });
          } catch (error) {
            console.error('Error creating popup (circle):', error);
          }
        }
      });

      // Dismiss popups during map interactions to reduce distraction without closing on fly animations
      const dismissEvents = [
        'dragstart',
      ] as const;
      dismissEvents.forEach((evt) => {
        map.on(evt, () => {
          try {
            currentPopupRef.current?.remove();
            currentPopupRef.current = null;
            document
              .querySelectorAll('.maplibregl-popup')
              .forEach((el) => el.remove());
          } catch {}
        });
      });

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

      // Responder pin click -> open Responder management popup (Figma-aligned)
      map.on("click", "responderLocation", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["responderLocation"] });
        if (!features.length) return;

        // Base position
        let lngLat: [number, number] | undefined;
        const f = features[0];
        if (f.geometry.type === "Point" && Array.isArray((f.geometry as any).coordinates)) {
          const c = (f.geometry as any).coordinates as [number, number];
          lngLat = [c[0], c[1]];
          while (Math.abs(e.lngLat.lng - lngLat[0]) > 180) {
            lngLat[0] += e.lngLat.lng > lngLat[0] ? 360 : -360;
          }
        }
        if (!lngLat) return;

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
  }, [selectedRisk, riskDatabase, currentHazard, isHeatmapEnabled]);

  // Handle search location zooming
  useEffect(() => {
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

    // Force visibility after map load
    mapRef.current.on("load", () => {
      setTimeout(ensureControlsVisible, 100);
    });

    // Also ensure visibility on any map interaction
    mapRef.current.on("moveend", ensureControlsVisible);
    mapRef.current.on("zoomend", ensureControlsVisible);
    mapRef.current.on("rotateend", ensureControlsVisible);
  }, []);

  return (
    <>
      <div className="relative w-full h-[calc(100vh-120px)] md:h-[90vh] z-0 rounded-xl shadow-lg">
        {/* Map Container */}
        <div id="map" className="w-full h-full" />
        {/* Bottom-center scroll button (relative to map, scrolls with page) */}
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
          <button
            type="button"
            aria-label="Scroll to bottom"
            title="Scroll to bottom"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
              }
            }}
            className="pointer-events-auto inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full bg-white text-red-600 shadow-lg border border-gray-200 hover:bg-red-50 active:scale-95 transition ring-1 ring-red-200"
          >
            <ArrowDown size={22} weight="bold" />
          </button>
        </div>
      </div>

      {/* Integrated Controls Overlay - Distributed positioning */}
      {/* Left Settings Sidebar */}
      <div className="absolute left-2 top-2 z-[110] pointer-events-auto">
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

      {/* Search Bar + Back Button - Top Left */}
      <div className="absolute top-2 md:top-4 left-2 md:left-4 z-[100] pointer-events-none">
        <div className="flex items-center gap-2">
          {/* Back button outside the search box */}
          <Link href="/" aria-label="Back to Home" className="pointer-events-auto">
            <span className="inline-flex items-center justify-center bg-white text-red-600 rounded-full w-7 h-7 md:w-12 md:h-12 shadow border border-gray-200 hover:bg-red-50 active:scale-95 transition">
              <ArrowLeft size={16} weight="bold" />
            </span>
          </Link>

          {/* Search box */}
          <div className="bg-white/90 backdrop-blur-md rounded-lg md:rounded-[40] shadow-xl pl-2 pr-1 md:p-3 md:pr-2 max-w-full md:max-w-md pointer-events-auto border border-white/20 md:w-80 md:h-12 flex items-center">
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
                  style={{marginRight: 0, paddingRight: 0}}
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

      {/* Hazard Controls - Top Center segmented chips */}
      <div className="absolute top-2 md:top-4 left-1/2 -translate-x-1/2 z-[105] pointer-events-none">
        <div className="flex items-center gap-2 md:gap-3 pointer-events-auto">
          {[
            { id: "flooding", label: "Flood", color: "#0ea5e9", icon: "/icons/flood icon.svg" },
            { id: "earthquake", label: "Earthquake", color: "#36A816", icon: "/icons/earthquake icon.svg" },
            { id: "landslide", label: "Landslide", color: "#f59e0b", icon: "/icons/landslide icon.svg" },
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

      {/* Right-side Controls (Menu, Zoom) */}
      <div className="absolute flex top-2 md:top-4 right-2 transform z-[100] pointer-events-none">
        <div className="flex flex-col gap-1 md:gap-2 pointer-events-auto">
          <Menu as="div" className="relative">
            <Menu.Button
              as="button"
              className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 hover:scale-105 active:scale-95 hover:shadow-2xl`}
              title="Settings"
            >
              <List size={20} weight="bold" className="text-gray-600" />
            </Menu.Button>
            <Menu.Items className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl border border-white/20 z-[100] focus:outline-none">
              <div className="p-2 space-y-1 text-gray-500">
                {/* Heatmap Toggle */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={toggleHeatmap}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        active ? "bg-gray-100" : ""
                      }`}
                    >
                      <Flame
                        size={20}
                        weight="bold"
                        className={
                          isHeatmapEnabled ? "text-orange-600" : "text-gray-600"
                        }
                      />
                      <span>
                        {isHeatmapEnabled
                          ? "Disable Heatmap"
                          : "Enable Heatmap"}
                      </span>
                    </button>
                  )}
                </Menu.Item>
                {/* Marker Toggle */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={toggleMarkers}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        active ? "bg-gray-100" : ""
                      }`}
                    >
                      {areMarkersVisible ? (
                        <Eye
                          size={16}
                          weight="bold"
                          className="text-blue-600"
                        />
                      ) : (
                        <EyeSlash
                          size={16}
                          weight="bold"
                          className="text-gray-600"
                        />
                      )}
                      <span>
                        {areMarkersVisible ? "Hide Markers" : "Show Markers"}
                      </span>
                    </button>
                  )}
                </Menu.Item>
                {/* Legend Toggle */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsLegendVisible(!isLegendVisible)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        active ? "bg-gray-100" : ""
                      }`}
                    >
                      <Info
                        size={16}
                        weight="bold"
                        className={
                          isLegendVisible ? "text-green-600" : "text-gray-600"
                        }
                      />
                      <span>
                        {isLegendVisible ? "Hide Legend" : "Show Legend"}
                      </span>
                    </button>
                  )}
                </Menu.Item>
                {/* 3D/2D Toggle */}
                <Menu.Item>
                  {({ active }) => (
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
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                        active ? "bg-gray-100" : ""
                      }`}
                    >
                      <Globe
                        size={16}
                        weight="bold"
                        className={is3D ? "text-blue-600" : "text-gray-600"}
                      />
                      <span>{is3D ? "Switch to 2D" : "Switch to 3D"}</span>
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
          {/* Hazard buttons moved to top-center */}

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
        </div>
      </div>

      {/* Legend - Bottom Right */}
      <div
        className={`absolute bottom-2 left-5 w-80 md:bottom-4 right-2 md:right-4 z-[100] bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl p-2 md:p-3 pointer-events-auto border border-white/20 ${
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

      {/* Removed fixed viewport button to keep the control static within the map area */}
    </>
  );
}
