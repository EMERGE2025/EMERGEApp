"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

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

const RotateControl = () => {
  class Control {
    _map: maplibregl.Map | undefined;
    _container!: HTMLElement;

    onAdd(map: maplibregl.Map) {
      this._map = map;
      this._container = document.createElement("div");
      this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";

      const button = document.createElement("button");
      button.className = "maplibregl-ctrl-icon text-black font-bold";
      button.type = "button";
      button.title = "Rotate Map";
      button.innerHTML = "⟳";

      button.onclick = () => {
        const currentBearing = map.getBearing();
        map.easeTo({
          bearing: currentBearing + 90,
          duration: 800,
        });
      };

      this._container.appendChild(button);
      return this._container;
    }

    onRemove() {
      this._container.parentNode?.removeChild(this._container);
      this._map = undefined;
    }

    getDefaultPosition(): maplibregl.ControlPosition {
      return "top-right";
    }
  }
  return new Control();
};

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
}: {
  mapType: mapType;
  selectedRisk: string;
  riskDatabase: Record<string, any>;
  searchLocation?: { lng: number; lat: number } | null;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [currentHazard, setCurrentHazard] = useState<string>("");

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
    });

    map.addControl(
      new maplibregl.NavigationControl({ visualizePitch: true }),
      "bottom-right"
    );
    map.addControl(RotateControl(), "bottom-right");

    setTimeout(() => {
      const compass = document.querySelector(
        ".maplibregl-ctrl-compass"
      ) as HTMLButtonElement;

      if (compass) {
        compass.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const is2D = mapRef.current?.getPitch() === 0;

          map.easeTo({
            pitch: is2D ? 60 : 0,
            bearing: is2D ? 180 : 0,
            duration: 1000,
          });
        });
      }
    }, 500);

    return () => {
      map.remove();
    };
  }, []);

  // Handle boundary loading separately from hazard switching
  useEffect(() => {
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) {
      console.log("Boundary loading skipped - map or data not ready", {
        mapReady: !!mapRef.current,
        dataReady: !!(riskDatabase && riskDatabase.length > 0)
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
      console.log("Available IDs:", riskDatabase.map((d: any) => d.id));
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

  // Handle hazard switching without reloading the map
  useEffect(() => {
    if (!mapRef.current || !riskDatabase || riskDatabase.length === 0) return;

    const map = mapRef.current;

    // Remove existing hazard layers and sources (but NOT boundary)
    const layersToRemove = [
      `${currentHazard}-risk`,
      "responderLocation",
      "responderRange",
      "clusters",
      "cluster-count",
      "unclustered-point"
    ];

    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
    });

    const sourcesToRemove = [
      `${currentHazard}-risk`,
      `${currentHazard}-responder`,
      `${currentHazard}-range`
    ];

    sourcesToRemove.forEach(sourceId => {
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
        const riskSource = map.getSource(`${hazard}-risk`) as maplibregl.GeoJSONSource;
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
        const responderLoc = map.getSource(`${hazard}-responder`) as maplibregl.GeoJSONSource;
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
        const responderRange = map.getSource(`${hazard}-range`) as maplibregl.GeoJSONSource;
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

      setCurrentHazard(selectedRisk);
    } catch (error) {
      console.error("Error switching hazard:", error);
    }
  }, [selectedRisk, riskDatabase, currentHazard]);

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

  return <div id="map" className="w-full h-[90vh] z-0 rounded-xl shadow-lg" />;
}
