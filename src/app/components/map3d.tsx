"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import { GeoJSON } from "geojson";

export type MarkerData = {
  id: number;
  lat: number;
  lng: number;
  type: string;
  title?: string;
  riskScore?: number;
  cluster?: number;
};

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

async function addGeoClusters(geodata: GeoJSON, map: maplibregl.Map) {
  map.addSource("risks", {
    type: "geojson",
    data: geodata,
    cluster: true,
    clusterMaxZoom: 17,
    clusterRadius: 50,
  });
}

export default function MapLibre3D({
  markers,
  mapType = "liberty",
}: {
  markers: MarkerData[];
  mapType: string;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);

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

    // Add markers
    markers.forEach((marker) => {
      const el = document.createElement("div");
      el.className = "";
      el.style.backgroundImage = `url(/icons/${marker.type}.svg)`; // e.g., responder.png
      el.style.width = "32px";
      el.style.height = "32px";
      el.style.backgroundSize = "contain";

      new maplibregl.Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .setPopup(new maplibregl.Popup().setText(marker.title || marker.type))
        .addTo(map);
    });

    return () => {
      map.remove();
    };
  }, [markers]);

  return <div id="map" className="w-full h-[90vh] z-0 rounded-xl shadow-lg" />;
}
