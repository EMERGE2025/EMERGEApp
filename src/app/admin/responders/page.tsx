"use client";

import MapLibre3D from "@/components/mapModule"; // Adjust this path to your mapModule.tsx
// DataTable temporarily removed
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/utils/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr"; // For loading

export default function AdminRespondersPage() {
  const router = useRouter();

  // --- UPDATED: State now starts empty and is filled by your new logic ---
  const [riskDatabase, setRiskDatabase] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const [selectedRisk, setSelectedRisk] = useState("flooding"); // Default risk

  // --- Admin Auth Check (Basic) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // If not logged in, redirect to login page
        router.push("/login");
      }
      // Add logic here to check for admin custom claim
      // if (user) {
      //   user.getIdTokenResult().then(token => {
      //     if (!token.claims.admin) {
      //       router.push("/"); // Not an admin, send to home
      //     }
      //   });
      // }
    });
    return () => unsubscribe();
  }, [router]);

  // --- NEW: Your data fetching logic ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching data from Firestore...");
        // Fetching from your 'PH063043000' collection
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
        // Set the state for the map
        setRiskDatabase(data);
      } catch (error) {
        console.error("Error fetching risk data:", error);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []); // Empty array ensures this runs once on mount

  // Dummy state functions for map props
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);

  return (
    <div className="relative w-full min-h-screen">
      <style jsx global>{`
        @media (max-width: 768px) {
          main {
            padding-bottom: 0 !important;
          }
        }
      `}</style>
      {isLoading ? (
        // Show a loading state while data is fetching
        <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-100">
          <CircleNotch size={48} className="animate-spin text-red-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">
            Loading Map Data...
          </p>
        </div>
      ) : (
        <>
          <div className="w-full h-screen">
            <MapLibre3D
              mapType="liberty"
              selectedRisk={selectedRisk}
              riskDatabase={riskDatabase}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearchSubmit={() => console.log("Search")}
              isSearching={false}
              onHazardChange={setSelectedRisk}
              userLocation={userLocation}
              onGetCurrentLocation={() => console.log("Get Location")}
              mode="admin"
              uniqueID="PH063043000"
            />
          </div>
          {/* Data Table Section removed for now */}
        </>
      )}
    </div>
  );
}
