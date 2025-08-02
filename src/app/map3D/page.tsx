import ClientOnly from "../components/clientOnly";
import MapLibre3D from "../components/mod3D";
import { MarkerData } from "../components/mod3D";

export type iconType = "earthquake" | "landslide" | "flood" | "responder";

export default async function Map3DPage() {
  let max = 4;

  const res = await fetch("http://localhost:8000/api/risk/landslide", {
    cache: "no-store",
    method: "POST",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch GeoJSON");
  }

  const geoJsonData = await res.json();

  const iconIndex: Record<number, iconType> = {
    1: "earthquake",
    2: "flood",
    3: "landslide",
    4: "responder",
  };

  console.log(geoJsonData);

  const markers: MarkerData[] = Array.from({ length: 500 }, (_, i) => ({
    id: i,
    lat: 10.757125443374584 + Math.random() * 0.1,
    lng: 122.47220080086756 + Math.random() * 0.1,
    type: iconIndex[Math.floor(Math.random() * max) + 1],
    title: `Marker ${i}`,
  }));

  // console.log(markers[0]);
  return (
    <main className="w-full h-[90vh]">
      <ClientOnly>
        <MapLibre3D
          selectedRisk="landslide"
          geoJsonData={geoJsonData}
          markers={markers}
        />
      </ClientOnly>
    </main>
  );
}
