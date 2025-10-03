"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import {
  MagnifyingGlassIcon,
  X,
  Flame,
  Eye,
  EyeSlash,
  Info,
  Globe,
  Plus,
  Minus,
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
  id: "flooding" | "landslide" | (string & {});
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
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [currentHazard, setCurrentHazard] = useState<string>("");
  const [isHeatmapEnabled, setIsHeatmapEnabled] = useState<boolean>(false);
  const [areMarkersVisible, setAreMarkersVisible] = useState<boolean>(true);
  const [isLegendVisible, setIsLegendVisible] = useState<boolean>(false);
  const [is3D, setIs3D] = useState<boolean>(true);

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
      `🔥 Toggling enhanced vulnerability heatmap for ${hazard}, current state: ${isHeatmapEnabled}`
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

      console.log(`🔥 Creating enhanced vulnerability heatmap for ${hazard}`);
      console.log(`📊 Hazard points: ${hazardGeoJSON.features?.length || 0}`);
      console.log(
        `👥 Population vulnerability data available:`,
        !!vulnerabilityData
      );

      if (!hazardGeoJSON.features || hazardGeoJSON.features.length === 0) {
        console.error("No hazard features found");
        return;
      }

      // Enhance hazard data with population vulnerability
      const enhancedFeatures = hazardGeoJSON.features.map((feature: any) => {
        const coords = feature.geometry.coordinates;
        let vulnerabilityScore = 0.5; // Default vulnerability

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
          `ℹ️ No population vulnerability data found. To enable enhanced risk assessment, add data with id: "population_vulnerability"`
        );
        console.log(
          `📋 Expected structure: { id: "population_vulnerability", vulnerability: GeoJSON with features having properties.vulnerabilityIndex (0-1) }`
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

      // Load initial hazard data (will be updated when riskDatabase becomes available)
      const initialHazard = selectedRisk || "flooding";
      console.log(`Map ready for hazard: ${initialHazard}`);

      // Add mobile-specific styles for controls
      const style = document.createElement("style");
      style.textContent = `
        @media (max-width: 768px) {
          .maplibregl-ctrl {
            font-size: 8px !important;
            padding: 1px !important;
          }
          .maplibregl-ctrl-icon {
            width: 16px !important;
            height: 16px !important;
          }
          .maplibregl-ctrl-group {
            margin: 1px !important;
          }
          .maplibregl-ctrl button {
            width: 24px !important;
            height: 24px !important;
            min-width: 24px !important;
            min-height: 24px !important;
          }
        }
      `;
      document.head.appendChild(style);
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
      if (map.getSource(`${hazard}-risk`)) {
        const riskSource = map.getSource(
          `${hazard}-risk`
        ) as maplibregl.GeoJSONSource;
        riskSource.setData(
          typeof riskData.risk === "string"
            ? JSON.parse(riskData.risk)
            : riskData.risk
        );
      } else {
        map.addSource(`${hazard}-risk`, {
          type: "geojson",
          data:
            typeof riskData.risk === "string"
              ? JSON.parse(riskData.risk)
              : riskData.risk,
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
        paint: { "line-color": "#008000", "line-width": 3 },
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
        const clusterId = clusterFeature.properties.cluster_id;
        const source = map.getSource(
          `${hazard}-risk`
        ) as maplibregl.GeoJSONSource & {
          getClusterExpansionZoom: (clusterId: number) => Promise<number>;
        };

        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = (clusterFeature.geometry as GeoJSON.Point)
          .coordinates;
        map.easeTo({
          center: coordinates as [number, number],
          zoom,
        });
      });

      // Update mouse events
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
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
      </div>

      {/* Integrated Controls Overlay - Distributed positioning */}
      {/* Search Bar - Top Left */}
      <div className="absolute top-2 md:top-4 left-2 md:left-4 z-[100] pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md rounded-lg md:rounded-xl shadow-xl p-2 md:p-3 max-w-full md:max-w-md pointer-events-auto border border-white/20">
          <div className="flex items-center gap-1 md:gap-2">
            <div className="bg-red-500 rounded-full p-1.5 md:p-2">
              <MagnifyingGlassIcon size={14} weight="bold" color="#fff" />
            </div>
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-xs md:text-sm placeholder-gray-500"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && onSearchSubmit()}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
              >
                <X size={14} />
              </button>
            )}
            <button
              onClick={onSearchSubmit}
              disabled={isSearching}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-full p-1.5 md:p-2 transition-colors min-w-[36px] min-h-[36px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center"
            >
              {isSearching ? (
                <div className="animate-spin w-3 h-3 md:w-4 md:h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <MagnifyingGlassIcon size={14} weight="bold" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hazard Control Buttons - Top Center */}
      <div className="absolute flex top-2 md:top-4 right-2 transform z-[100] pointer-events-none">
        <div className="flex flex-col gap-1 md:gap-2 pointer-events-auto">
          <button
            onClick={() => onHazardChange("flooding")}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ${
              selectedRisk === "flooding"
                ? "ring-2 ring-blue-500 bg-blue-50 shadow-blue-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title="Flood Hazard"
          >
            <img
              src="/icons/flooding.png"
              alt="Flood"
              className="w-5 h-5 md:w-6 md:h-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/icons/flooding.svg";
              }}
            />
          </button>

          <button
            onClick={() => onHazardChange("landslide")}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ${
              selectedRisk === "landslide"
                ? "ring-2 ring-orange-500 bg-orange-50 shadow-orange-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title="Landslide Hazard"
          >
            <img
              src="/icons/landslide.png"
              alt="Landslide"
              className="w-5 h-5 md:w-6 md:h-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/icons/landslide.svg";
              }}
            />
          </button>

          <button
            onClick={() => onHazardChange("earthquake")}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ${
              selectedRisk === "earthquake"
                ? "ring-2 ring-red-500 bg-red-50 shadow-red-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title="Earthquake Hazard"
          >
            <img
              src="/icons/earthquake.png"
              alt="Earthquake"
              className="w-5 h-5 md:w-6 md:h-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/icons/earthquake.svg";
              }}
            />
          </button>

          {/* Heatmap Toggle Button */}
          <button
            onClick={() => {
              console.log("Heatmap button clicked");
              toggleHeatmap();
            }}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ml-2 ${
              isHeatmapEnabled
                ? "ring-2 ring-orange-500 bg-orange-50 shadow-orange-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title={isHeatmapEnabled ? "Disable Heatmap" : "Enable Heatmap"}
          >
            <Flame
              size={20}
              weight="bold"
              className={isHeatmapEnabled ? "text-orange-600" : "text-gray-600"}
            />
          </button>

          {/* Marker Toggle Button */}
          <button
            onClick={() => {
              console.log("Marker toggle button clicked");
              toggleMarkers();
            }}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ml-2 ${
              areMarkersVisible
                ? "ring-2 ring-blue-500 bg-blue-50 shadow-blue-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title={areMarkersVisible ? "Hide Markers" : "Show Markers"}
          >
            {areMarkersVisible ? (
              <Eye size={20} weight="bold" className="text-blue-600" />
            ) : (
              <EyeSlash size={20} weight="bold" className="text-gray-600" />
            )}
          </button>

          {/* Legend Toggle Button */}
          <button
            onClick={() => setIsLegendVisible(!isLegendVisible)}
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ml-2 ${
              isLegendVisible
                ? "ring-2 ring-green-500 bg-green-50 shadow-green-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title={isLegendVisible ? "Hide Legend" : "Show Legend"}
          >
            <Info
              size={20}
              weight="bold"
              className={isLegendVisible ? "text-green-600" : "text-gray-600"}
            />
          </button>

          {/* 3D/2D Toggle Button */}
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
            className={`bg-white/90 backdrop-blur-md hover:bg-white shadow-xl rounded-lg md:rounded-xl p-2 md:p-3 transition-all duration-200 min-w-[44px] min-h-[44px] md:min-w-[48px] md:min-h-[48px] flex items-center justify-center border border-white/20 ml-2 ${
              is3D
                ? "ring-2 ring-blue-500 bg-blue-50 shadow-blue-200"
                : "hover:scale-105 active:scale-95 hover:shadow-2xl"
            }`}
            title={is3D ? "Switch to 2D" : "Switch to 3D"}
          >
            <Globe
              size={20}
              weight="bold"
              className={is3D ? "text-blue-600" : "text-gray-600"}
            />
          </button>

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
              <div className="w-full h-3 rounded-sm bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-600 border border-gray-300"></div>
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
    </>
  );
}
