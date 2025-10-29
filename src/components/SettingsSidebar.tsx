"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CaretLeft, CaretRight, Minus, Plus } from "@phosphor-icons/react/dist/ssr";

export type SettingsSidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
  // map controls
  isHeatmapEnabled: boolean;
  onToggleHeatmap: () => void;
  areMarkersVisible: boolean;
  onToggleMarkers: () => void;
  clustersCount?: number;
  onClustersCountChange?: (n: number) => void;
};

export default function SettingsSidebar({
  isOpen,
  onToggle,
  isHeatmapEnabled,
  onToggleHeatmap,
  areMarkersVisible,
  onToggleMarkers,
  clustersCount = 8,
  onClustersCountChange,
}: SettingsSidebarProps) {
  // Derived styles for panel state
  const panelWidth = "w-96"; // keep full width; collapse hides content but shows header
  const contentHidden = isOpen ? "opacity-100" : "hidden";

  // Track which menu item is selected for styling
  const [selectedKey, setSelectedKey] = useState<string>("");

  const rowBase =
    "h-12 px-2 rounded border-b border-gray-200 inline-flex justify-between items-center transition-colors duration-150";
  const makeRowClass = (selected: boolean) =>
    `${rowBase} ${selected ? "bg-red-50" : "hover:bg-gray-100 cursor-pointer"}`;
  const makeLabelClass = (selected: boolean) =>
    `text-base font-medium leading-8 ${selected ? "text-red-600" : "text-gray-600"}`;
  const iconMask = (file: string, selected: boolean) => (
    <span
      aria-hidden
      className="shrink-0 mr-3 block w-5 h-5"
      style={{
        WebkitMaskImage: `url('/icons/${file}')`,
        maskImage: `url('/icons/${file}')`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        backgroundColor: selected ? "#dc2626" : "#9ca3af",
      }}
    />
  );

  return (
    <div className={`absolute top-20 md:top-16 left-2 md:left-2 z-[110] ${panelWidth} transition-all duration-300`}
      aria-label="EMERGE Settings Sidebar"
    >
      <div className="relative">
        {/* Panel */}
        <div className="p-4 bg-gray-50 rounded-2xl shadow-[0px_0px_12px_0px_rgba(0,0,0,0.20)] inline-flex flex-col justify-start items-stretch gap-3 border border-gray-200">
          {/* Header */}
          <div className="pl-px pr-2 py-2 rounded-lg inline-flex items-center gap-3">
            <div className="flex justify-start items-center gap-3.5 flex-1">
              <img src="/icons/EMERGE Logo_no_outline.svg" alt="EMERGE" className="w-7 h-7 object-contain" />
              <div className="text-left">
                <span className="text-gray-800 text-xl font-semibold leading-8">EMERGE </span>
                <span className="text-gray-800 text-xl font-medium leading-8">Settings</span>
              </div>
            </div>
            {/* Minimize/Maximize toggle inside header */}
            <button
              onClick={onToggle}
              className="ml-auto inline-flex items-center justify-center w-7 h-7 rounded-[40] bg-red-500 text-white hover:bg-red-600 active:scale-95 transition border-0 outline-none ring-0 focus:outline-none focus:ring-0 shadow-none"
              title={isOpen ? "Minimize" : "Maximize"}
              aria-label={isOpen ? "Minimize" : "Maximize"}
            >
              {isOpen ? <Minus size={16} weight="bold" className="text-white" /> : <Plus size={16} weight="bold" className="text-white" />}
            </button>
          </div>

          {/* Content */}
          <div className={`flex flex-col justify-start items-stretch gap-1 transition-opacity duration-200 ${contentHidden}`}>
            {/* Clustering Algorithm - placeholder row */}
            <button
              className={makeRowClass(selectedKey === "clustering")}
              onClick={() => setSelectedKey("clustering")}
            >
              <div className="flex items-center">
                {iconMask("clustering algorithm icon.svg", selectedKey === "clustering")}
                <div className={makeLabelClass(selectedKey === "clustering")}>
                  Clustering Algorithm
                </div>
              </div>
              <div className="text-xs text-gray-400 italic">(Coming soon)</div>
            </button>

            {/* Number of Response Clusters */}
            <div className={`${selectedKey === "clusters" ? "bg-red-50" : "hover:bg-gray-100 cursor-pointer"} rounded border-b border-gray-200 transition-colors`}>
              {/* Top row */}
              <button
                className="w-full h-12 px-2 inline-flex justify-between items-center"
                onClick={() => setSelectedKey(selectedKey === "clusters" ? "" : "clusters")}
                aria-expanded={selectedKey === "clusters"}
              >
                <div className="flex justify-start items-center gap-3 flex-1 min-w-0">
                  {iconMask("number of response clusters icon.svg", selectedKey === "clusters")}
                  <div className={makeLabelClass(selectedKey === "clusters") + " truncate sm:whitespace-normal"}>
                    Number of Response Clusters
                  </div>
                </div>
                <div className={`${selectedKey === "clusters" ? "text-red-600" : "text-gray-400"} text-sm font-semibold leading-8 min-w-[1.5rem] text-right`}>
                  {clustersCount}
                </div>
              </button>
              {/* Inline details (same parent box) */}
              {selectedKey === "clusters" && (
                <div className="mt-2 pl-8 pr-2 pb-2">
                  <input
                    type="range"
                    min={1}
                    max={12}
                    value={clustersCount}
                    onChange={(e) => onClustersCountChange?.(parseInt(e.target.value))}
                    className="w-full accent-red-600"
                  />
                </div>
              )}
            </div>

            {/* Filter Population Data - placeholder */}
            <button
              className={makeRowClass(selectedKey === "filter")}
              onClick={() => setSelectedKey("filter")}
            >
              <div className="flex items-center">
                {iconMask("filter population data icon.svg", selectedKey === "filter")}
                <div className={makeLabelClass(selectedKey === "filter")}>
                  Filter Population Data
                </div>
              </div>
              <div className="text-xs text-gray-400 italic">(Coming soon)</div>
            </button>

            {/* Risk Severity Threshold - slider integrated within parent */}
            <div className={`${selectedKey === "risk" ? "bg-red-50" : "hover:bg-gray-100 cursor-pointer"} rounded border-b border-gray-200 transition-colors`}>
              <button
                className="w-full h-12 px-2 inline-flex justify-between items-center"
                onClick={() => setSelectedKey(selectedKey === "risk" ? "" : "risk")}
                aria-expanded={selectedKey === "risk"}
              >
                <div className="flex items-center flex-1 min-w-0">
                  {iconMask("risk severity threshold icon.svg", selectedKey === "risk")}
                  <div className={makeLabelClass(selectedKey === "risk")}>Risk Severity Threshold</div>
                </div>
                <div className={`text-sm font-semibold ${selectedKey === "risk" ? "text-red-600" : "text-gray-400"}`}>Adjust</div>
              </button>
              {selectedKey === "risk" && (
                <div className="mt-2 pl-8 pr-2 pb-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={50}
                    className="w-full accent-red-600"
                  />
                </div>
              )}
            </div>

            {/* Heatmap Overlay - wired to map toggle */}
            <button
              onClick={() => {
                onToggleHeatmap();
                setSelectedKey("heatmap");
              }}
              className={makeRowClass(isHeatmapEnabled || selectedKey === "heatmap")}
            >
              <div className="flex items-center">
                {iconMask("heatmap overlay icon.svg", isHeatmapEnabled || selectedKey === "heatmap")}
                <div className={makeLabelClass(isHeatmapEnabled || selectedKey === "heatmap")}>
                  Heatmap Overlay
                </div>
              </div>
              <span className={`text-sm font-semibold ${isHeatmapEnabled ? "text-red-600" : "text-gray-400"}`}>
                {isHeatmapEnabled ? "On" : "Off"}
              </span>
            </button>

            {/* Marker Visibility - wired to toggle */}
            <button
              onClick={() => {
                onToggleMarkers();
                setSelectedKey("markers");
              }}
              className={makeRowClass(areMarkersVisible || selectedKey === "markers")}
            >
              <div className="flex items-center">
                {iconMask("responder.svg", areMarkersVisible || selectedKey === "markers")}
                <div className={makeLabelClass(areMarkersVisible || selectedKey === "markers")}>Markers</div>
              </div>
              <span className={`text-sm font-semibold ${areMarkersVisible ? "text-red-600" : "text-gray-400"}`}>
                {areMarkersVisible ? "Shown" : "Hidden"}
              </span>
            </button>

            {/* Upload New Data */}
            <Link
              href="/upload"
              onClick={() => setSelectedKey("upload")}
              className={makeRowClass(selectedKey === "upload")}
            >
              <div className="flex items-center">
                {iconMask("upload new data icon.svg", selectedKey === "upload")}
                <div className={makeLabelClass(selectedKey === "upload")}>Upload New Data</div>
              </div>
              <span className="text-xs text-gray-400">Open</span>
            </Link>

            {/* Export - placeholder */}
            <button
              className={makeRowClass(selectedKey === "export")}
              onClick={() => setSelectedKey("export")}
            >
              <div className="flex items-center">
                {iconMask("export data icon.svg", selectedKey === "export")}
                <div className={makeLabelClass(selectedKey === "export")}>Export Current View and Results</div>
              </div>
              <span className="text-xs text-gray-400">(Soon)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
