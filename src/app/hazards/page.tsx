"use client";

import { useState, useEffect } from "react";
import { ListIcon } from "@phosphor-icons/react/dist/ssr";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import CustomButton from "@/components/customButton";
import ClientOnly from "@/components/clientOnly";
import MapLibre3D from "@/components/mapModule";
import { iconType } from "@/components/mapModule";

import { db } from "@/utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Hazards() {
  const [selectedRisk, setSelectedRisk] = useState("flooding");
  const [riskData, setRiskData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "PH063043000"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRiskData(data);
      } catch (error) {
        console.error("Error fetching risk data:", error);
      }
    };
    fetchData();
  }, []);

  // const snapshot = await adminDb.collection("PH063043000").get();
  // console.log(snapshot.docs);
  // const riskData = snapshot.docs.map((docs) => ({
  //   id: docs.id,
  //   ...docs.data(),
  // }));

  // console.log(riskData);

  // console.log(riskData[0].boundary);
  // console.log(riskData[1].responderLocation);
  // console.log(riskData[2].responderRange);

  // const riskData = snapshot.docs.map((doc) => {
  //   const data = doc.data();

  //   return {
  //     id: doc.id,
  //     ...Object.fromEntries(
  //       Object.entries(data).map(([key, value]) => {
  //         try {
  //           // Try to parse value as JSON, if possible
  //           return [key, JSON.parse(value)];
  //         } catch {
  //           // Otherwise just return as-is
  //           return [key, value];
  //         }
  //       })
  //     ),
  //   };
  // });
  // console.log(riskData);

  // console.log(riskData[0]?.boundary);

  // const flooding = await fetch("http://localhost:8000/api/risk/flooding", {
  //   cache: "no-store",
  //   method: "POST",
  // });

  // const landslide = await fetch("http://localhost:8000/api/risk/landslide", {
  //   cache: "no-store",
  //   method: "POST",
  // });

  // if (!flooding.ok && !landslide.ok) {
  //   throw new Error("Failed to fetch GeoJSON");
  // }

  // const markers: MarkerData[] = Array.from({ length: 500 }, (_, i) => ({
  //   id: i,
  //   lat: 10.757125443374584 + Math.random() * 0.1,
  //   lng: 122.47220080086756 + Math.random() * 0.1,
  //   type: iconIndex[Math.floor(Math.random() * max) + 1],
  //   title: `Marker ${i}`,
  // }));

  // const floodJson = await flooding.json();
  // const landslideJson = await landslide.json();

  return (
    <main className="flex flex-col bg-white justify-between">
      <div className="flex w-full items-center text-black z-100 absolute p-5">
        {/* Search Bar Here */}
        <div className="flex w-1/2 items-center gap-2">
          <ListIcon size={32} />
          <div className="rounded-full w-1/2 bg-red-500 flex items-center p-2 gap-2">
            <input
              type="text"
              className="bg-red-50 w-full rounded-full px-5 py-1"
              placeholder="Search Location"
            />
            <MagnifyingGlassIcon size={32} weight="bold" color="#fff" />
          </div>
        </div>
        <div className="flex w-1/2 justify-end gap-5 px-10 py-2">
          {/* Flood */}
          <CustomButton
            text={"Flood"}
            status={selectedRisk === "flooding" ? "active" : "default"}
            onClick={() => setSelectedRisk("flooding")}
          />
          {/* Landslide */}
          <CustomButton
            text={"Landslide"}
            status={selectedRisk === "landslide" ? "active" : "default"}
            onClick={() => setSelectedRisk("landslide")}
          />
          {/* Earthquake */}
          <CustomButton
            text={"Earthquake"}
            status={selectedRisk === "earthquake" ? "active" : "default"}
            onClick={() => setSelectedRisk("earthquake")}
          />
        </div>
      </div>
      <div id="map">
        <ClientOnly>
          <MapLibre3D
            mapType="liberty"
            selectedRisk={selectedRisk}
            riskDatabase={riskData}
          />
        </ClientOnly>
      </div>
    </main>
  );
}
