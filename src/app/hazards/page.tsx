"use server";

import { ListIcon } from "@phosphor-icons/react/dist/ssr";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import CustomButton from "@/components/customButton";
import ClientOnly from "@/components/clientOnly";
import MapLibre3D from "@/components/mapModule";
import { iconType } from "@/components/mapModule";

import { adminDb } from "@/utils/firebaseAdmin";
import fs from "fs";
import path from "path";

export default async function Hazards() {
  let max = 4;

  const iconIndex: Record<number, iconType> = {
    1: "earthquake",
    2: "flood",
    3: "landslide",
    4: "responder",
  };

  // Simple daily cache using a file (for server-side, not for client-side)
  const cacheFile = path.resolve("/tmp/hazard_cache.json");
  let riskData: any[] = [];

  const now = new Date();
  let cacheValid = false;

  if (fs.existsSync(cacheFile)) {
    const cache = JSON.parse(fs.readFileSync(cacheFile, "utf-8"));
    const lastFetched = new Date(cache.timestamp);
    // Check if cache is from today
    cacheValid =
      lastFetched.getFullYear() === now.getFullYear() &&
      lastFetched.getMonth() === now.getMonth() &&
      lastFetched.getDate() === now.getDate();

    if (cacheValid) {
      riskData = cache.data;
    }
  }

  if (!cacheValid) {
    const snapshot = await adminDb.collection("PH063043000").get();
    riskData = snapshot.docs.map((docs) => ({
      id: docs.id,
      ...docs.data(),
    }));
    fs.writeFileSync(
      cacheFile,
      JSON.stringify({ timestamp: now.toISOString(), data: riskData })
    );
  }

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
          {/* Flood dw */}
          <CustomButton text={"Flood"} status={"active"} />
          {/* Landslide */}
          <CustomButton text={"Landslide"} status={"default"} />
          {/* Earthquake */}
          <CustomButton text={"Earthquake"} status={"default"} />
        </div>
      </div>
      <div id="map">
        <ClientOnly>
          <MapLibre3D
            // markers={markers}
            mapType="liberty"
            selectedRisk="flooding"
            riskDatabase={riskData}
          />
        </ClientOnly>
      </div>
    </main>
  );
}
