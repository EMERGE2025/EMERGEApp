"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl, { Map as MLMap } from "maplibre-gl";
// @ts-ignore: side-effect CSS import without type declarations
import "maplibre-gl/dist/maplibre-gl.css";

// ---------- Types ----------
type MapStyle = "liberty" | "positron" | "bright";
type GJ = GeoJSON.FeatureCollection | GeoJSON.Feature | string;

interface BoundaryEntry {
  id: "boundary";
  boundary: GJ;
}

interface HazardEntry {
  id: "flooding" | "landslide" | (string & {});
  risks: GJ; // clustered on zoom
  responderRange?: GJ; // optional: lines/polys
  responderLocation?: GJ; // keep your own clustering if you already have it
}

type RiskDatabase = (BoundaryEntry | HazardEntry)[];

// ---------- Helpers ----------
const styleURL = (style: MapStyle) =>
  `https://tiles.openfreemap.org/styles/${style}`;

const isHazard = (x: BoundaryEntry | HazardEntry): x is HazardEntry =>
  x.id !== "boundary";

const groupIds = (base: string) => ({
  boundary: `${base}-boundary-layer`,
  risks: {
    source: `${base}-risks`,
    clusters: `${base}-clusters`,
    count: `${base}-cluster-count`,
    unclustered: `${base}-unclustered`,
  },
  range: `${base}-range-layer`,
  responders: `${base}-responders-layer`,
});

function setVisibility(map: MLMap, layerId: string, visible: boolean) {
  if (!map.getLayer(layerId)) return;
  map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
}

// ---------- Component ----------
export default function MapLibre3D({
  mapType = "liberty",
  riskDatabase,
}: {
  mapType?: MapStyle;
  riskDatabase: RiskDatabase;
}) {
  const mapRef = useRef<MLMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track individual visibility per concrete map layer id
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  // Precompute button models
  const sidePanel = useMemo(() => {
    const items: {
      label: string;
      layerIds: string[];
      key: string;
    }[] = [];

    for (const entry of riskDatabase) {
      if (entry.id === "boundary") {
        const ids = groupIds("boundary");
        items.push({
          label: "Boundary",
          layerIds: [ids.boundary],
          key: "boundary",
        });
      } else {
        const ids = groupIds(entry.id);
        // Risks (clustered)
        items.push({
          label: `${entry.id} • Risks (clustered)`,
          layerIds: [
            ids.risks.clusters,
            ids.risks.count,
            ids.risks.unclustered,
          ],
          key: `${entry.id}-risks`,
        });
        // // Range
        // if (entry.responderRange) {
        //   items.push({
        //     label: `${entry.id} • Responder Range`,
        //     layerIds: [ids.range],
        //     key: `${entry.id}-range`,
        //   });
        // }
        // // Responders
        // if (entry.responderLocation) {
        //   items.push({
        //     label: `${entry.id} • Responders`,
        //     layerIds: [ids.responders],
        //     key: `${entry.id}-responders`,
        //   });
        // }
      }
    }
    return items;
  }, [riskDatabase]);

  // Initialize map and layers
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleURL(mapType),
      center: [122.56, 10.72],
      zoom: 13,
      pitch: 45,
      bearing: 0,
    });

    mapRef.current = map;

    map.on("load", () => {
      // 1) Boundary
      const boundary = riskDatabase.find((d) => d.id === "boundary") as
        | BoundaryEntry
        | undefined;

      console.log(boundary);

      if (boundary?.boundary) {
        map.addSource("boundary", { type: "geojson", data: boundary.boundary });
        map.addLayer({
          id: "boundary",
          type: "line",
          source: "boundary",
          paint: { "line-color": "#111827", "line-width": 2 },
        });
      }

      // // 2) Hazards: risks clustered, optional range + responders
      // for (const entry of riskDatabase) {
      //   if (!isHazard(entry)) continue;
      //   const ids = groupIds(entry.id);

      //   // Risks (clustered)
      //   map.addSource(ids.risks.source, {
      //     type: "geojson",
      //     data: entry.risks,
      //     cluster: true,
      //     clusterMaxZoom: 14,
      //     clusterRadius: 50,
      //   });

      //     map.addLayer({
      //       id: ids.risks.clusters,
      //       type: "circle",
      //       source: ids.risks.source,
      //       filter: ["has", "point_count"],
      //       layout: { visibility: "none" },
      //       paint: {
      //         "circle-radius": [
      //           "step",
      //           ["get", "point_count"],
      //           14,
      //           25,
      //           20,
      //           100,
      //           28,
      //         ],
      //         "circle-color": entry.id === "flooding" ? "#2563eb" : "#dc2626",
      //       },
      //     });

      //     map.addLayer({
      //       id: ids.risks.count,
      //       type: "symbol",
      //       source: ids.risks.source,
      //       filter: ["has", "point_count"],
      //       layout: {
      //         visibility: "none",
      //         "text-field": "{point_count_abbreviated}",
      //         "text-size": 12,
      //       },
      //       paint: { "text-color": "#ffffff" },
      //     });

      //     map.addLayer({
      //       id: ids.risks.unclustered,
      //       type: "circle",
      //       source: ids.risks.source,
      //       filter: ["!", ["has", "point_count"]],
      //       layout: { visibility: "none" },
      //       paint: {
      //         "circle-radius": 6,
      //         "circle-stroke-width": 1,
      //         "circle-stroke-color": "#ffffff",
      //         "circle-color": entry.id === "flooding" ? "#3b82f6" : "#ef4444",
      //       },
      //     });

      //     // Responder Range (line/polygon outline)
      //     if (entry.responderRange) {
      //       map.addSource(`${entry.id}-range`, {
      //         type: "geojson",
      //         data: entry.responderRange,
      //       });
      //       map.addLayer({
      //         id: ids.range,
      //         type: "line",
      //         source: `${entry.id}-range`,
      //         layout: { visibility: "none" },
      //         paint: {
      //           "line-color": "#f59e0b",
      //           "line-width": 2,
      //           "line-dasharray": [2, 2],
      //         },
      //       });
      //     }

      //     // Responders (no clustering here since you already handle it)
      //     if (entry.responderLocation) {
      //       map.addSource(`${entry.id}-responders`, {
      //         type: "geojson",
      //         data: entry.responderLocation,
      //       });
      //       map.addLayer({
      //         id: ids.responders,
      //         type: "circle",
      //         source: `${entry.id}-responders`,
      //         layout: { visibility: "none" },
      //         paint: {
      //           "circle-radius": 6,
      //           "circle-stroke-width": 2,
      //           "circle-stroke-color": "#ffffff",
      //           "circle-color": "#10b981",
      //         },
      //       });
      //     }
      //   }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [mapType, riskDatabase]);

  // Toggle groups by buttons (independent)
  const toggleGroup = (layerIds: string[], key: string) => {
    const map = mapRef.current;
    if (!map) return;

    const nextVisible = !layerIds.some((id) => visible[id]);
    layerIds.forEach((id) => {
      setVisibility(map, id, nextVisible);
    });

    setVisible((prev) => {
      const next = { ...prev };
      layerIds.forEach((id) => (next[id] = nextVisible));
      return next;
    });
  };

  return (
    <div className="flex h-[90vh] gap-3">
      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-gray-100 p-4 rounded-xl shadow-md overflow-y-auto">
        <h2 className="font-bold mb-3">Layers & Filters</h2>
        <div className="space-y-2">
          {sidePanel.map((item) => {
            const isOn = item.layerIds.every((id) => visible[id]);
            return (
              <button
                key={item.key}
                onClick={() => toggleGroup(item.layerIds, item.key)}
                className={`w-full text-left px-3 py-2 rounded-lg transition
                  ${
                    isOn
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }
                `}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Map */}
      <div
        ref={containerRef}
        className="flex-1 h-full rounded-xl shadow-lg border border-gray-200"
      />
    </div>
  );
}
