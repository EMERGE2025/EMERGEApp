"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type HazardType = "landslide" | "flooding" | "earthquake";

interface HazardContextType {
  hazardType: HazardType;
  setHazardType: (type: HazardType) => void;
}

const HazardContext = createContext<HazardContextType | undefined>(undefined);

export const useHazard = () => {
  const context = useContext(HazardContext);
  if (context === undefined) {
    throw new Error("useHazard must be used within a HazardProvider");
  }
  return context;
};

interface HazardProviderProps {
  children: ReactNode;
}

export const HazardProvider = ({ children }: HazardProviderProps) => {
  const [hazardType, setHazardTypeState] = useState<HazardType>("landslide");

  useEffect(() => {
    const stored = localStorage.getItem("hazardType") as HazardType;
    if (stored) setHazardTypeState(stored);
  }, []);

  const setHazardType = (type: HazardType) => {
    setHazardTypeState(type);
    localStorage.setItem("hazardType", type);
  };

  const value = {
    hazardType,
    setHazardType,
  };

  return (
    <HazardContext.Provider value={value}>{children}</HazardContext.Provider>
  );
};
