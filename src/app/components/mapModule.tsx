"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";

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

export default function MapLibre3D({
  // markers,
  mapType = "liberty",
  // selectedRisk = "flooding",
  floodingGeoJson,
  landslideGeoJson,
}: {
  // markers: MarkerData[];
  mapType: string;
  selectedRisk: string;
  floodingGeoJson: string;
  landslideGeoJson: string;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);

  console.log(floodingGeoJson);

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

    map.on("load", () => {
      // Getting Source Data
      if (map.getSource("flooding")) {
        const source = map.getSource("flooding") as maplibregl.GeoJSONSource;
        source.setData(floodingGeoJson);
      } else {
        // Flooding Geojson Data
        map.addSource("flooding", {
          type: "geojson",
          data: floodingGeoJson,
          cluster: true,
          clusterMaxZoom: 17,
          clusterRadius: 50,
        });
      }

      map
        .loadImage("icons/flooding.png")
        .then((res) => {
          const image = res.data;
          if (!map.hasImage("icons/flooding.png")) {
            map.addImage("flooding", image);
          }

          map.addLayer({
            id: "flooding",
            type: "symbol",
            source: "flooding",
            filter: ["!", ["has", "point_count"]],
            layout: {
              "icon-image": "flooding",
              "icon-size": 0.5,
            },
          });
        })
        .catch((error) => {
          console.error("Failed to load image:", error);
        });

      // Adding Cluster Layers
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "flooding",
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
        source: "flooding",
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
        source: "flooding",
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
        const source = map.getSource("flooding") as maplibregl.GeoJSONSource & {
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
