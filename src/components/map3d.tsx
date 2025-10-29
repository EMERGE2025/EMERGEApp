"use client";

import maplibregl from "maplibre-gl";
// @ts-ignore: side-effect CSS import without type declarations
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

export default function MapLibre3D({
  // markers,
  mapType = "liberty",
  selectedRisk = "flooding",
  geoJsonData,
}: {
  // markers: MarkerData[];
  mapType: string;
  selectedRisk: string;
  geoJsonData: string;
}) {
  const mapRef = useRef<maplibregl.Map | null>(null);

  console.log(geoJsonData);

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
            source: "geo_data",
            layout: {
              "icon-image": "flooding",
              "icon-size": 0.5,
            },
          });
        })
        .catch((error) => {
          console.error("Failed to load image:", error);
        });

      // map.addLayer({
      //   id: "landslide",
      //   type: "symbol",
      //   source: "geo_data",
      //   layout: {
      //     // If you want to display text:
      //     "text-field": ["get", "ADM4_EN"], // adjust this to your property key
      //     "text-size": 12,
      //     "text-offset": [0, 1.2],
      //     "text-anchor": "top",
      //     // Or if you want to display an icon:
      //     "icon-image": "flooding", // make sure it's in your sprite
      //   },
      //   paint: {
      //     "text-color": "#d63031",
      //   },
      // });

      // for (const marker of markers) {
      //   if (marker.icon && !map.hasImage(marker.icon)) {
      //     try {
      //       const image = await map.loadImage(marker.icon);
      //       map.addImage(marker.icon, image.data);
      //     } catch (err) {
      //       console.warn(`Failed to load icon for ${marker.icon}`);
      //     }
      //   }
      // }

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "geo_data",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-font": ["Noto Sans Regular"],
          "text-size": 25,
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
      });

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

        // const responderPoints = markers.map((marker) =>
        //   turf.point([marker.lng, marker.lat])
        // );
        // const voronoiPolygons = turf.voronoi(
        //   turf.featureCollection(responderPoints)
        // );

        // if (voronoiPolygons && !map.getSource("voronoi")) {
        //   map.addSource("voronoi", {
        //     type: "geojson",
        //     data: voronoiPolygons,
        //   });

        //   map.addLayer({
        //     id: "voronoi-layer",
        //     type: "fill",
        //     source: "voronoi",
        //     paint: {
        //       "fill-color": "#00ffff33",
        //       "fill-outline-color": "#00ffff",
        //     },
        //   });
      }
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
