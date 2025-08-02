"use client";

import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import * as turf from "@turf/turf";

export interface MarkerData {
  id: number;
  lat: number;
  lng: number;
  type: string;
  title?: string;
  icon?: string;
}

export interface MapLibre3DProps {
  markers: MarkerData[];
  selectedRisk: string;
  geoJsonData: GeoJSON.FeatureCollection;
}

const RotateControl = () => {
  class Control implements maplibregl.IControl {
    _map: maplibregl.Map | undefined;
    _container: HTMLElement;

    constructor() {
      this._container = document.createElement("div");
    }

    onAdd(map: maplibregl.Map) {
      this._map = map;
      this._container.className = "maplibregl-ctrl maplibregl-ctrl-group";

      const button = document.createElement("button");
      button.className = "maplibregl-ctrl-icon";
      button.type = "button";
      button.title = "Rotate Map";
      button.innerHTML = "⟳";

      button.onclick = () => {
        const currentBearing = map.getBearing();
        map.easeTo({
          bearing: currentBearing + 45,
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

const MapLibre3D: React.FC<MapLibre3DProps> = ({
  markers,
  selectedRisk,
  geoJsonData,
}) => {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [0.123, 51.2345],
      zoom: 2,
      pitch: 0,
      canvasContextAttributes: { antialias: true },
    });

    mapRef.current = map;

    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
    });

    map.on("load", async () => {
      if (map.getSource("geo_data")) {
        const source = map.getSource("geo_data") as maplibregl.GeoJSONSource;
        source.setData(geoJsonData);
      } else {
        map.addSource("geo_data", {
          type: "geojson",
          data: geoJsonData,
          cluster: true,
          clusterMaxZoom: 17,
          clusterRadius: 50,
        });
      }

      for (const marker of markers) {
        if (marker.icon && !map.hasImage(marker.icon)) {
          try {
            const image = await map.loadImage(marker.icon);
            map.addImage(marker.icon, image.data);
          } catch (err) {
            console.warn(`Failed to load icon for ${marker.icon}`);
          }
        }
      }

      if (!map.getLayer("clusters")) {
        map.addLayer({
          id: "clusters",
          type: "circle",
          source: "geo_data",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#51bbd655",
              100,
              "#f1f07555",
              750,
              "#f28cb155",
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
            "circle-stroke-width": [
              "step",
              ["get", "point_count"],
              1,
              100,
              1,
              750,
              1,
            ],
            "circle-stroke-color": [
              "step",
              ["get", "point_count"],
              "#000",
              100,
              "#000",
              750,
              "#000",
            ],
          },
        });

        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: "geo_data",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-font": ["Noto Sans Regular"],
            "text-size": 25,
          },
        });

        map.addLayer({
          id: "unclustered-point",
          source: "geo_data",
          filter: [
            "all",
            ["!", ["has", "point_count"]],
            ["==", ["get", "risk_type"], selectedRisk],
          ],
          type: "symbol",
          layout: {
            "icon-overlap": "always",
            "icon-image": ["get", "icon"],
            "icon-size": 0.1,
          },
        });
      }

      const responderPoints = markers.map((marker) =>
        turf.point([marker.lng, marker.lat])
      );
      const voronoiPolygons = turf.voronoi(
        turf.featureCollection(responderPoints)
      );

      if (voronoiPolygons && !map.getSource("voronoi")) {
        map.addSource("voronoi", {
          type: "geojson",
          data: voronoiPolygons,
        });

        map.addLayer({
          id: "voronoi-layer",
          type: "fill",
          source: "voronoi",
          paint: {
            "fill-color": "#00ffff33",
            "fill-outline-color": "#00ffff",
          },
        });
      }
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right"
    );
    map.addControl(RotateControl(), "top-right");

    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (map.getLayer("unclustered-point")) {
      map.setFilter("unclustered-point", [
        "all",
        ["!", ["has", "point_count"]],
        ["==", ["get", "risk_type"], selectedRisk],
      ]);
    }
  }, [selectedRisk]);

  return (
    <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
  );
};

export default MapLibre3D;
