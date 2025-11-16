"use client";

import { useState, useEffect } from "react";
import ClientOnly from "@/components/clientOnly";
import MapLibre3D from "@/components/mapModule";
import { useAuth } from "@/contexts/AuthContext";

import { db } from "@/utils/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Hazards() {
  const { userRole } = useAuth();
  const [selectedRisk, setSelectedRisk] = useState("flooding");
  const [riskData, setRiskData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lng: number;
    lat: number;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching data from Firestore...");
        const querySnapshot = await getDocs(collection(db, "PH063043000"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched data:", data);
        console.log("Data length:", data.length);
        console.log(
          "Document IDs:",
          data.map((d) => d.id)
        );

        // Check if boundary exists
        const boundaryEntry = data.find((item) => item.id === "boundary");
        console.log("Boundary entry:", boundaryEntry);

        // Ensure boundary exists even with real data
        const hasBoundary = data.some((item: any) => item.id === "boundary");
        if (!hasBoundary) {
          console.warn(
            "No boundary in Firestore data, adding fallback boundary"
          );
          const fallbackBoundary = {
            id: "boundary",
            boundary: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [122.4, 10.7],
                        [122.6, 10.7],
                        [122.6, 10.8],
                        [122.4, 10.8],
                        [122.4, 10.7],
                      ],
                    ],
                  },
                  properties: {
                    name: "Santa Barbara Boundary (Fallback)",
                  },
                },
              ],
            },
          };
          data.unshift(fallbackBoundary);
        }
        setRiskData(data);
      } catch (error) {
        console.error("Error fetching risk data:", error);
      }
    };
    fetchData();
  }, []);

  // Gets the user's current location using the browser's Geolocation API
  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { longitude, latitude } = position.coords;
          console.log("User location found:", { longitude, latitude });
          const newLocation = { lng: longitude, lat: latitude };
          setUserLocation(newLocation);
        },
        (error) => {
          console.error("Error getting user location:", error);
          alert(
            "Error: Unable to retrieve your location. Please check browser permissions."
          );
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // OpenStreetMap Geocoding Search
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      // Santa Barbara, Iloilo bounding box (approximate)
      const bbox = "122.0,10.6,122.8,10.9";

      // Use Nominatim API (OpenStreetMap geocoding)
      const searchQuery = encodeURIComponent(query);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&bounded=1&viewbox=${bbox}&limit=5&countrycodes=PH&addressdetails=1`;

      console.log("Searching for:", query);
      console.log("API URL:", url);

      const response = await fetch(url, {
        headers: {
          "User-Agent": "EMERGE-Hazards-App/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const results = await response.json();
      console.log("Geocoding results:", results);

      if (results && results.length > 0) {
        // Find the best match (prioritize places in Santa Barbara, Iloilo)
        let bestResult = results[0];

        // Look for results in Santa Barbara, Iloilo
        const santaBarbaraResult = results.find(
          (result: any) =>
            result.display_name?.toLowerCase().includes("santa barbara") ||
            result.display_name?.toLowerCase().includes("iloilo")
        );

        if (santaBarbaraResult) {
          bestResult = santaBarbaraResult;
        }

        const { lat, lon, display_name, type, importance } = bestResult;

        console.log(`Found location: ${display_name} at [${lon}, ${lat}]`);
        console.log(`Type: ${type}, Importance: ${importance}`);

        return {
          lng: parseFloat(lon),
          lat: parseFloat(lat),
          found: true,
          displayName: display_name,
          type: type,
        };
      }

      // If no results found, try a broader search without bounding box
      console.log("No results in Santa Barbara area, trying broader search...");
      const broadUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=3&countrycodes=PH&addressdetails=1`;

      const broadResponse = await fetch(broadUrl, {
        headers: {
          "User-Agent": "EMERGE-Hazards-App/1.0",
        },
      });

      if (broadResponse.ok) {
        const broadResults = await broadResponse.json();
        if (broadResults && broadResults.length > 0) {
          const { lat, lon, display_name, type } = broadResults[0];
          console.log(
            `Found location (broad search): ${display_name} at [${lon}, ${lat}]`
          );

          return {
            lng: parseFloat(lon),
            lat: parseFloat(lat),
            found: true,
            displayName: display_name,
            type: type,
            note: "Location found outside Santa Barbara area",
          };
        }
      }

      return { found: false };
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return { found: false, error: errorMessage };
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault;
    const result = await handleSearch(searchQuery);
    if (
      result &&
      result.found &&
      result.lng !== undefined &&
      result.lat !== undefined
    ) {
      setSearchResult({ lng: result.lng, lat: result.lat });
      console.log("Zooming to:", result);
      // Clear search result after a delay to allow re-searching
      setTimeout(() => setSearchResult(null), 100);
    } else {
      alert(
        `Location "${searchQuery}" not found in Santa Barbara, Iloilo area. Try searching for:\n• Barangay names (e.g., "Barangay 1", "Poblacion")\n• Landmarks (e.g., "church", "school", "market")\n• Streets or neighborhoods\n• Check spelling and try again`
      );
    }
  };

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
    <main className="flex flex-col bg-white justify-between min-h-screen relative">
      <style jsx global>{`
        nav {
          display: none !important;
        }
        @media (max-width: 768px) {
          main {
            padding-bottom: 64px;
          }
        }
      `}</style>
      <div id="map" className="relative">
        <ClientOnly>
          <MapLibre3D
            mapType="liberty"
            selectedRisk={selectedRisk}
            riskDatabase={riskData}
            searchLocation={searchResult}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearchSubmit={() => handleSearchSubmit({} as React.FormEvent)}
            isSearching={isSearching}
            onHazardChange={setSelectedRisk}
            userLocation={userLocation}
            onGetCurrentLocation={handleGetCurrentLocation}
            mode={userRole || "user"}
            uniqueID="PH063043000"
          />
        </ClientOnly>
      </div>
    </main>
  );
}
