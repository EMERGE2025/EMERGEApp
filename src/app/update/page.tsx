"use client";

import React, { useState } from "react";

interface HistoryEntry {
  date: string;
  time: string;
  description: string;
}

interface MonthData {
  [key: string]: HistoryEntry[];
}

export default function UpdatePage() {
  const [selectedFiles, setSelectedFiles] = useState<{
    [key: string]: File | null;
  }>({
    population: null,
    flood: null,
    earthquake: null,
    landslide: null,
  });

  const [dragOver, setDragOver] = useState<{ [key: string]: boolean }>({
    population: false,
    flood: false,
    earthquake: false,
    landslide: false,
  });

  // Sample history data
  const historyData: { [year: string]: MonthData } = {
    "2025": {
      July: [
        { date: "12-06-01", time: "12:00 AM", description: "Changed Da..." },
        { date: "12-06-01", time: "12:00 AM", description: "Changed Da..." },
      ],
      June: [
        { date: "12-06-01", time: "12:00 AM", description: "Changed Da..." },
        { date: "12-06-01", time: "12:00 AM", description: "Changed Da..." },
      ],
    },
  };

  const handleFileChange = (category: string, file: File | null) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [category]: file,
    }));
  };

  const handleFileSelect = (
    category: string,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0] || null;
    handleFileChange(category, file);
  };

  const handleDragOver = (category: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver((prev) => ({ ...prev, [category]: true }));
  };

  const handleDragLeave = (category: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver((prev) => ({ ...prev, [category]: false }));
  };

  const handleDrop = (category: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver((prev) => ({ ...prev, [category]: false }));

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Check if it's a CSV file
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        handleFileChange(category, file);
      } else {
        alert("Please upload a CSV file.");
      }
    }
  };

  const triggerFileInput = (category: string) => {
    const input = document.getElementById(
      `file-input-${category}`
    ) as HTMLInputElement;
    input?.click();
  };

  const handleUploadData = (category: string) => {
    // Handle file upload logic here
    const file = selectedFiles[category];
    if (file) {
      console.log(`Uploading ${category} data:`, file);
      // Here you would typically upload the file to your server
      alert(`File "${file.name}" selected for ${category} data upload!`);
    } else {
      triggerFileInput(category);
    }
  };

  const handleConfirmUploads = () => {
    // Handle confirmation of all uploads
    console.log("Confirming all uploads:", selectedFiles);
  };

  return (
    <main className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-gray-800 mb-2">
            Hi,{" "}
            <span className="text-[#b92727] font-semibold">Anna Freeman!</span>
          </h1>
        </div>

        {/* Line */}
        <div className="border-t border-gray-300 mb-8"></div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Section - Update Data */}
          <div className="lg:col-span-2">
            {/* Update Data Header */}
            <div className="p-4 mb-6 pl-0">
              <h2 className="text-[40px] font-semibold text-gray-800 mb-1">
                Update Data
              </h2>
              <p className="text-sm text-gray-500">
                Upload the latest data to get the most accurate placement
              </p>
            </div>

            {/* Data Upload Cards */}
            <div className="space-y-4 mb-6">
              {/* Population Data */}
              <div
                className={`bg-white rounded-lg shadow-sm border p-6 transition-colors ${
                  dragOver.population
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200"
                }`}
                onDragOver={(e) => handleDragOver("population", e)}
                onDragLeave={(e) => handleDragLeave("population", e)}
                onDrop={(e) => handleDrop("population", e)}
              >
                <input
                  type="file"
                  id="file-input-population"
                  accept=".csv"
                  onChange={(e) => handleFileSelect("population", e)}
                  className="hidden"
                />
                <div className="flex flex-col">
                  <div className="flex items-center space-x-10 mb-0">
                    <div className="w-50 h-50 rounded-xl flex items-center justify-center p-0 overflow-hidden">
                      {/* Graphics */}
                      <img
                        src="/hazard graphics/population data.svg"
                        alt="Population Data"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-red-700 mb-0">
                        Population
                      </h3>
                      <h3 className="text-2xl font-bold text-red-700 mb-4">
                        Data
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Upload from your computer or by <br />
                        Drag-and-Dropping
                      </p>
                      {selectedFiles.population ? (
                        <p className="text-sm text-[#24800B] font-medium mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">
                            {selectedFiles.population.name}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-800 mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">Filename.csv</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Last Updated: Aug 1, 2025 12:00 A.M
                        </p>
                        <button
                          onClick={() => handleUploadData("population")}
                          className="bg-[#2E2C2F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1819] transition-colors"
                        >
                          {selectedFiles.population
                            ? "Upload Selected"
                            : "Upload Data"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flood Risk Data */}
              <div
                className={`bg-white rounded-lg shadow-sm border p-6 transition-colors ${
                  dragOver.flood
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200"
                }`}
                onDragOver={(e) => handleDragOver("flood", e)}
                onDragLeave={(e) => handleDragLeave("flood", e)}
                onDrop={(e) => handleDrop("flood", e)}
              >
                <input
                  type="file"
                  id="file-input-flood"
                  accept=".csv"
                  onChange={(e) => handleFileSelect("flood", e)}
                  className="hidden"
                />
                <div className="flex flex-col">
                  <div className="flex items-center space-x-10 mb-0">
                    <div className="w-50 h-50 rounded-xl flex items-center justify-center p-0 overflow-hidden">
                      {/* Graphics */}
                      <img
                        src="/hazard graphics/flood risk graphic.svg"
                        alt="Flood Risk Data"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-[#1883D0] mb-0">
                        Flood Risk
                      </h3>
                      <h3 className="text-2xl font-bold text-[#1883D0] mb-4">
                        Data
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Upload from your computer or by <br />
                        Drag-and-Dropping
                      </p>
                      {selectedFiles.flood ? (
                        <p className="text-sm text-[#24800B] font-medium mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">
                            {selectedFiles.flood.name}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-800 mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">Filename.csv</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Last Updated: Aug 1, 2025 12:00 A.M
                        </p>
                        <button
                          onClick={() => handleUploadData("flood")}
                          className="bg-[#2E2C2F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1819] transition-colors"
                        >
                          {selectedFiles.flood
                            ? "Upload Selected"
                            : "Upload Data"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earthquake Risk Data */}
              <div
                className={`bg-white rounded-lg shadow-sm border p-6 transition-colors ${
                  dragOver.earthquake
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200"
                }`}
                onDragOver={(e) => handleDragOver("earthquake", e)}
                onDragLeave={(e) => handleDragLeave("earthquake", e)}
                onDrop={(e) => handleDrop("earthquake", e)}
              >
                <input
                  type="file"
                  id="file-input-earthquake"
                  accept=".csv"
                  onChange={(e) => handleFileSelect("earthquake", e)}
                  className="hidden"
                />
                <div className="flex flex-col">
                  <div className="flex items-center space-x-10 mb-0">
                    <div className="w-50 h-50 rounded-xl flex items-center justify-center p-0 overflow-hidden">
                      {/* Graphics */}
                      <img
                        src="/hazard graphics/earthquake risk graphic.svg"
                        alt="Earthquake Risk Data"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-orange-700 mb-0">
                        Earthquake
                      </h3>
                      <h3 className="text-2xl font-bold text-orange-700 mb-4">
                        Risk Data
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Upload from your computer or by <br />
                        Drag-and-Dropping
                      </p>
                      {selectedFiles.earthquake ? (
                        <p className="text-sm text-[#24800B] font-medium mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">
                            {selectedFiles.earthquake.name}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-800 mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">Filename.csv</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Last Updated: Aug 1, 2025 12:00 A.M
                        </p>
                        <button
                          onClick={() => handleUploadData("earthquake")}
                          className="bg-[#2E2C2F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1819] transition-colors"
                        >
                          {selectedFiles.earthquake
                            ? "Upload Selected"
                            : "Upload Data"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Landslide Risk Data */}
              <div
                className={`bg-white rounded-lg shadow-sm border p-6 transition-colors ${
                  dragOver.landslide
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200"
                }`}
                onDragOver={(e) => handleDragOver("landslide", e)}
                onDragLeave={(e) => handleDragLeave("landslide", e)}
                onDrop={(e) => handleDrop("landslide", e)}
              >
                <input
                  type="file"
                  id="file-input-landslide"
                  accept=".csv"
                  onChange={(e) => handleFileSelect("landslide", e)}
                  className="hidden"
                />
                <div className="flex flex-col">
                  <div className="flex items-center space-x-10 mb-0">
                    <div className="w-50 h-50 rounded-xl flex items-center justify-center p-0 overflow-hidden">
                      {/* Graphics */}
                      <img
                        src="/hazard graphics/landslide risk graphic.svg"
                        alt="Landslide Data"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-yellow-700 mb-0">
                        Landslide
                      </h3>
                      <h3 className="text-2xl font-bold text-yellow-700 mb-4">
                        Risk Data
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Upload from your computer or by <br />
                        Drag-and-Dropping
                      </p>
                      {selectedFiles.landslide ? (
                        <p className="text-sm text-[#24800B] font-medium mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">
                            {selectedFiles.landslide.name}
                          </span>
                        </p>
                      ) : (
                        <p className="text-sm text-gray-800 mb-1">
                          Uploaded:{" "}
                          <span className="font-medium">Filename.csv</span>
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Last Updated: Aug 1, 2025 12:00 A.M
                        </p>
                        <button
                          onClick={() => handleUploadData("landslide")}
                          className="bg-[#2E2C2F] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#1a1819] transition-colors"
                        >
                          {selectedFiles.landslide
                            ? "Upload Selected"
                            : "Upload Data"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Uploads Button */}
            <button
              onClick={handleConfirmUploads}
              className="w-full justify-end md:w-auto bg-[#2E2C2F] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#1a1819] transition-colors"
            >
              Confirm Uploads
            </button>
          </div>

          {/* Right Section - History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                History
              </h2>
              <p className="text-sm text-gray-600 mb-6">View recent updates</p>

              <div className="space-y-6">
                {Object.entries(historyData).map(([year, months]) => (
                  <div key={year}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {year}
                    </h3>
                    {Object.entries(months).map(([month, entries]) => (
                      <div key={month} className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          {month}
                        </h4>
                        <div className="space-y-2">
                          {entries.map((entry, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-xs"
                            >
                              <div className="flex space-x-4">
                                <span className="text-gray-500">
                                  {entry.date}
                                </span>
                                <span className="text-gray-500">
                                  {entry.time}
                                </span>
                                <span className="text-gray-700">
                                  {entry.description}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  See More...
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
