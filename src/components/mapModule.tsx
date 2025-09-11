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
  // markers,
  mapType = "liberty",
  // selectedRisk = "flooding",
  riskDatabase,
}: {
  // markers: MarkerData[];
  mapType: mapType;
  selectedRisk: string;
  riskDatabase: Record<string, any>;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);

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
      // Getting Source Data
      // if (map.getSource("flooding")) {
      //   const source = map.getSource("flooding") as maplibregl.GeoJSONSource;
      //   source.setData(floodingGeoJson);
      // } else {
      //   // Flooding Geojson Data
      //   map.addSource("flooding", {
      //     type: "geojson",
      //     data: floodingGeoJson,
      //     cluster: true,
      //     clusterMaxZoom: 17,
      //     clusterRadius: 50,
      //   });
      // }

      const boundary = riskDatabase.find(
        (d: { id: string }) => d.id === "boundary"
      ) as BoundaryEntry;

      if (map.getSource("boundary")) {
        const boundarySource = map.getSource(
          "boundary"
        ) as maplibregl.GeoJSONSource;
        boundarySource.setData(boundary.boundary);
      } else {
        map.addSource("boundary", {
          type: "geojson",
          data:
            typeof boundary.boundary === "string"
              ? JSON.parse(boundary.boundary)
              : boundary.boundary,
        });
      }

      map.addLayer({
        id: "boundary",
        type: "line",
        source: "boundary",
        paint: {
          "line-color": "#ff0000",
          "line-width": 3,
        },
      });

      // Specific Risk Data
      const hazard = "flooding";

      // Loading Flooding Layer
      const riskData = riskDatabase.find(
        (d: { id: string }) => d.id === hazard
      ) as HazardEntry;

      // console.log(riskData);

      if (map.getSource(hazard)) {
        const riskSource = map.getSource(hazard) as maplibregl.GeoJSONSource;
        riskSource.setData(riskData.risk);
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

      map
        .loadImage(`icons/${hazard}.png`)
        .then((res) => {
          const image = res.data;
          if (!map.hasImage(`icons/${hazard}.png`)) {
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
          console.error("Failed to load image:", error);
        });

      // Loading Responder Data
      if (map.getSource("responderLocation")) {
        const responderLoc = map.getSource(
          "responderLocation"
        ) as maplibregl.GeoJSONSource;
        if (riskData.responderLocation !== undefined) {
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
          if (!map.hasImage("icons/flooding.png")) {
            map.addImage("responder", image);
          }

          map.addLayer({
            id: "responderLocation",
            type: "symbol",
            source: `${hazard}-responder`,
            // filter: ["has", "point_count"],
            layout: {
              "icon-image": "responder",
              "icon-size": 0.5,
            },
          });
        })
        .catch((error) => {
          console.error("Failed to load image:", error);
        });

      // Loading Responder Data
      if (map.getSource("responderRange")) {
        const responderLoc = map.getSource(
          "responderRange"
        ) as maplibregl.GeoJSONSource;
        if (riskData.responderRange !== undefined) {
          responderLoc.setData(
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

      // Adding Cluster Layers
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

      // Cluster Counts
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

      // Unclustered Points
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

      // Inspect cluster on click
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

      // Cluster Controls
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });
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

          // Old Map Converter!

          // const currentBearing = mapRef.current?.getBearing() ?? 0;
          // const newBearing = currentBearing >= 180 ? 0 : 180;

          // mapRef.current?.easeTo({
          //   pitch: currentBearing >= 180 ? 0 : 60,
          //   bearing: newBearing,
          //   duration: 1000,
          // });

          const is2D = mapRef.current?.getPitch() === 0;

          map.easeTo({
            pitch: is2D ? 60 : 0,
            bearing: is2D ? 180 : 0,
            duration: 1000,
          });
        });
      }
    }, 500);

    // // Add markers
    // markers.forEach((marker) => {
    //   const el = document.createElement("div");
    //   el.className = "";
    //   el.style.backgroundImage = `url(/icons/${marker.type}.svg)`; // e.g., responder.png
    //   el.style.width = "32px";
    //   el.style.height = "32px";
    //   el.style.backgroundSize = "contain";

    //   new maplibregl.Marker({ element: el })
    //     .setLngLat([marker.lng, marker.lat])
    //     .setPopup(new maplibregl.Popup().setText(marker.title || marker.type))
    //     .addTo(map);
    // });

    return () => {
      map.remove();
    };
  }, []);

  return <div id="map" className="w-full h-[90vh] z-0 rounded-xl shadow-lg" />;
}
