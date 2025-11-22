"use client";

import React, { useState, Fragment } from "react";
import Link from "next/link";
import { SidebarSimple } from "@phosphor-icons/react/dist/ssr";
import { Transition } from "@headlessui/react";

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

/**
 * This is your complete settings panel.
 * I have removed its internal 'isOpen' logic to fix the closing lag.
 */
function EmergeSettingsPanel({
  onToggle, // Removed 'isOpen' from here
  isHeatmapEnabled,
  onToggleHeatmap,
  areMarkersVisible,
  onToggleMarkers,
  clustersCount = 8,
  onClustersCountChange,
}: Omit<SettingsSidebarProps, "isOpen">) {
  // Use Omit to remove isOpen
  // Track which menu item is selected for styling
  const [selectedKey, setSelectedKey] = useState<string>("");

  const rowBase =
    "h-12 px-2 rounded border-b border-gray-200 inline-flex justify-between items-center transition-colors duration-150";
  const makeRowClass = (selected: boolean) =>
    `${rowBase} ${selected ? "bg-red-50" : "hover:bg-gray-100 cursor-pointer"}`;
  const makeLabelClass = (selected: boolean) =>
    `text-base font-medium leading-8 ${
      selected ? "text-red-600" : "text-gray-600"
    }`;
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
    <div
      className="p-4 bg-gray-50 rounded-2xl shadow-[0px_0px_12px_0px_rgba(0,0,0,0.20)] inline-flex flex-col justify-start items-stretch gap-3 border border-gray-200"
      aria-label="EMERGE Settings Panel"
    >
      {/* Header */}
      <div className="pl-px pr-2 py-2 rounded-lg inline-flex items-center gap-3">
        <div className="flex justify-start items-center gap-3.5 flex-1">
          <img
            src="/icons/EMERGE Logo_no_outline.svg"
            alt="EMERGE"
            className="w-7 h-7 object-contain"
          />
          <div className="text-left">
            <span className="text-gray-800 text-xl font-semibold leading-8">
              EMERGE{" "}
            </span>
            <span className="text-gray-800 text-xl font-medium leading-8">
              Settings
            </span>
          </div>
        </div>
        {/* --- Toggle button (use sidepanel icon) --- */}
        <button
          onClick={onToggle}
          className="ml-auto inline-flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 active:scale-95 transition border-0 outline-none ring-0 focus:outline-none focus:ring-0 shadow-none text-red-600 bg-transparent"
          title={"Toggle sidebar"}
          aria-label={"Toggle sidebar"}
        >
          <SidebarSimple size={20} weight="regular" className="text-red-600" />
        </button>
      </div>

      {/* --- FIX: Removed 'contentHidden' to stop lag --- */}
      <div
        className={`flex flex-col justify-start items-stretch gap-1 transition-opacity duration-200`}
      >
        {/* Heatmap Overlay - wired to map toggle */}
        <button
          onClick={() => {
            onToggleHeatmap();
            setSelectedKey("heatmap");
          }}
          className={makeRowClass(
            isHeatmapEnabled || selectedKey === "heatmap"
          )}
        >
          <div className="flex items-center">
            {iconMask(
              "heatmap overlay icon.svg",
              isHeatmapEnabled || selectedKey === "heatmap"
            )}
            <div
              className={makeLabelClass(
                isHeatmapEnabled || selectedKey === "heatmap"
              )}
            >
              Heatmap Overlay
            </div>
          </div>
          <span
            className={`text-sm font-semibold ${
              isHeatmapEnabled ? "text-red-600" : "text-gray-400"
            }`}
          >
            {isHeatmapEnabled ? "On" : "Off"}
          </span>
        </button>

        {/* Marker Visibility - wired to toggle */}
        <button
          onClick={() => {
            onToggleMarkers();
            setSelectedKey("markers");
          }}
          className={makeRowClass(
            areMarkersVisible || selectedKey === "markers"
          )}
        >
          <div className="flex items-center">
            {iconMask(
              "responder.svg",
              areMarkersVisible || selectedKey === "markers"
            )}
            <div
              className={makeLabelClass(
                areMarkersVisible || selectedKey === "markers"
              )}
            >
              Markers
            </div>
          </div>
          <span
            className={`text-sm font-semibold ${
              areMarkersVisible ? "text-red-600" : "text-gray-400"
            }`}
          >
            {areMarkersVisible ? "Shown" : "Hidden"}
          </span>
        </button>

        {/* Upload New Data */}
        <Link
          href="/admin/update"
          onClick={() => setSelectedKey("upload")}
          className={makeRowClass(selectedKey === "upload")}
        >
          <div className="flex items-center">
            {iconMask("upload new data icon.svg", selectedKey === "upload")}
            <div className={makeLabelClass(selectedKey === "upload")}>
              Upload New Data
            </div>
          </div>
          <span className="text-xs text-gray-400">Open</span>
        </Link>
      </div>
    </div>
  );
}

/**
 * This is the responsive shell.
 */
export default function SettingsSidebar(props: SettingsSidebarProps) {
  const {
    isOpen,
    onToggle,
    isHeatmapEnabled,
    areMarkersVisible,
    clustersCount,
    onToggleHeatmap,
    onToggleMarkers,
    onClustersCountChange,
  } = props;

  return (
    <div className="relative">
      {/* When open, render the full sidebar inline (no logo button) */}
      <Transition
        show={isOpen}
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="transform opacity-0 translate-y-1"
        enterTo="transform opacity-100 translate-y-0"
        leave="transition ease-in duration-100"
        leaveFrom="transform opacity-100 translate-y-0"
        leaveTo="transform opacity-0 translate-y-1"
      >
        <div className="w-screen max-w-sm">
          <EmergeSettingsPanel
            onToggle={onToggle}
            isHeatmapEnabled={isHeatmapEnabled}
            areMarkersVisible={areMarkersVisible}
            clustersCount={clustersCount}
            onToggleHeatmap={onToggleHeatmap}
            onToggleMarkers={onToggleMarkers}
            onClustersCountChange={onClustersCountChange}
          />
        </div>
      </Transition>

      {/* When closed, show a small reopen chevron button (no logo) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label="Open Settings"
          title="Open Settings"
          className="pointer-events-auto inline-flex items-center justify-center bg-white/90 backdrop-blur-md rounded-lg p-2 shadow-lg border border-gray-200 hover:bg-white active:scale-95 transition min-w-[44px] min-h-[44px]"
        >
          <SidebarSimple size={20} weight="bold" className="text-red-600" />
        </button>
      )}
    </div>
  );
}
