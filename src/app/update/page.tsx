"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface HistoryEntry {
  date: string;
  time: string;
  description: string;
  type: string;
  formattedDate: string;
}

interface MonthData {
  [key: string]: HistoryEntry[];
}

export default function UpdatePage() {
  const { user } = useAuth();
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

  const [uploading, setUploading] = useState(false);
  const [uploadMessages, setUploadMessages] = useState<string>('');
  const [logs, setLogs] = useState<string>('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/update-logs');
        const data = await response.json();
        setLogs(data.logs);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };
    fetchLogs();
  }, []);

  const parseLogs = (logs: string): { [year: string]: MonthData } => {
    const history: { [year: string]: MonthData } = {};
    const lines = logs.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      const match = line.match(/^\[(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\] User: (.+) \(ID: (.+)\) uploaded '(.+)' as type '(.+)'$/);
      if (match) {
        const [, year, monthNum, day, hour, min, sec, name, id, filename, type] = match;
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const month = monthNames[parseInt(monthNum) - 1];
        const date = `${monthNum}-${day}-${year.slice(2)}`; // MM-DD-YY
        const time24 = `${hour}:${min}:${sec}`;
        const time12 = new Date(`2000-01-01T${time24}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        const formattedDate = `${month.slice(0,3)} ${day}, ${year} ${time12}`;
        const description = `${name} uploaded '${filename}' as ${type}`;

        if (!history[year]) history[year] = {};
        if (!history[year][month]) history[year][month] = [];
        history[year][month].push({ date, time: time12, description, type, formattedDate });

        // Sort entries by date descending
        history[year][month].sort((a, b) => {
          const [ma, da, ya] = a.date.split('-').map(Number);
          const [mb, db, yb] = b.date.split('-').map(Number);
          const dateA = new Date(2000 + ya, ma - 1, da);
          const dateB = new Date(2000 + yb, mb - 1, db);
          return dateB.getTime() - dateA.getTime();
        });
      }
    });
    return history;
  };

  const historyData = parseLogs(logs);

  const lastUpdated: { [type: string]: string } = {};
  const monthOrder: { [key: string]: number } = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
  };
  for (const year of Object.keys(historyData).sort((a, b) => parseInt(b) - parseInt(a))) {
    for (const month of Object.keys(historyData[year]).sort((a, b) => monthOrder[b] - monthOrder[a])) {
      for (const entry of historyData[year][month]) {
        if (!lastUpdated[entry.type]) {
          lastUpdated[entry.type] = entry.formattedDate;
        }
      }
    }
  }

  const iconMap: { [key: string]: string } = {
    population: '/hazard graphics/population data.svg',
    flooding: '/hazard graphics/flood risk graphic.svg',
    earthquake: '/hazard graphics/earthquake risk graphic.svg',
    landslide: '/hazard graphics/landslide risk graphic.svg',
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

  const getAllowedExtensions = (category: string) => {
    if (category === 'population') return ['csv', 'xlsx'];
    return ['geojson', 'gpkg'];
  };

  const handleDrop = (category: string, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver((prev) => ({ ...prev, [category]: false }));

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      const allowed = getAllowedExtensions(category);
      if (allowed.includes(ext || '')) {
        handleFileChange(category, file);
      } else {
        alert(`Please upload a file with one of these extensions: ${allowed.join(', ')}`);
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

  const handleConfirmUploads = async () => {
    if (!user) {
      alert('Please log in to upload files.');
      return;
    }
    const filesToUpload = Object.entries(selectedFiles).filter(([_, file]) => file !== null);
    if (filesToUpload.length === 0) {
      alert('Please select at least one file to upload.');
      return;
    }
    setUploading(true);
    setUploadMessages('');

    for (const [category, file] of filesToUpload) {
      if (!file) continue;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', category === 'flood' ? 'flooding' : category);
      formData.append('username', user.displayName || user.email || 'Unknown');
      formData.append('user_id', user.uid);

      try {
        const response = await fetch('http://127.0.0.1:8000/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        setUploadMessages(prev => prev + `${category}: ${result.message}\n`);
      } catch (error) {
        setUploadMessages(prev => prev + `${category}: Upload failed\n`);
      }
    }
    setUploading(false);
  };

  return (
    <main className="min-h-screen bg-[#f5f6fa] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-gray-800 mb-2">
            Hi,{" "}
            <span className="text-[#b92727] font-semibold">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}!
            </span>
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
                   accept=".csv,.xlsx"
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
                           <span className="font-medium">No file selected</span>
                         </p>
                        )}
                       <div className="flex items-center justify-between">
                         <p className="text-sm text-gray-500">
                           Last Updated: {lastUpdated['population'] || "No updates yet"}
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
                   accept=".geojson,.gpkg"
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
                           <span className="font-medium">No file selected</span>
                         </p>
                        )}
                       <div className="flex items-center justify-between">
                         <p className="text-sm text-gray-500">
                           Last Updated: {lastUpdated['flooding'] || "No updates yet"}
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
                   accept=".geojson,.gpkg"
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
                           <span className="font-medium">No file selected</span>
                         </p>
                        )}
                       <div className="flex items-center justify-between">
                         <p className="text-sm text-gray-500">
                           Last Updated: {lastUpdated['earthquake'] || "No updates yet"}
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
                   accept=".geojson,.gpkg"
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
                           <span className="font-medium">No file selected</span>
                         </p>
                        )}
                       <div className="flex items-center justify-between">
                         <p className="text-sm text-gray-500">
                           Last Updated: {lastUpdated['landslide'] || "No updates yet"}
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
              disabled={uploading}
              className="w-full justify-end md:w-auto bg-[#2E2C2F] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#1a1819] transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Confirm Uploads'}
            </button>
            {uploadMessages && (
              <pre className="mt-4 whitespace-pre-wrap text-sm text-gray-700 bg-gray-100 p-4 rounded">
                {uploadMessages}
              </pre>
            )}
          </div>

          {/* Right Section - History */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                History
              </h2>
              <p className="text-sm text-gray-600 mb-6">View recent updates</p>

               <div className="space-y-6">
                 {Object.keys(historyData).length > 0 ? (
                   Object.entries(historyData).map(([year, months]) => (
                     <div key={year}>
                       <h3 className="text-lg font-semibold text-gray-800 mb-4">
                         {year}
                       </h3>
                       {Object.entries(months).map(([month, entries]) => (
                         <div key={month} className="mb-6">
                           <h4 className="text-sm font-medium text-gray-700 mb-3">
                             {month}
                           </h4>
                           <div className="space-y-4">
                             {entries.map((entry, index) => (
                               <div key={index} className="flex items-start space-x-4">
                                 <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300">
                                   <img src={iconMap[entry.type] || '/hazard graphics/population data.svg'} alt={entry.type} className="w-full h-full object-cover" />
                                 </div>
                                 <div className="flex-1">
                                   <div className="bg-gray-100 rounded-lg p-3 mb-2 relative text-sm text-gray-600">
                                     {entry.date} at {entry.time}
                                     <div className="absolute top-3 left-[-8px] w-0 h-0 border-r-8 border-r-gray-100 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                   </div>
                                   <div className="bg-blue-50 rounded-lg p-3 relative text-sm text-gray-700">
                                     {(() => {
                                       const [name, rest] = entry.description.split(' uploaded ');
                                       return <><strong className="text-blue-600">{name}</strong> uploaded {rest}</>;
                                     })()}
                                     <div className="absolute top-3 left-[-8px] w-0 h-0 border-r-8 border-r-blue-50 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
                                   </div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                     </div>
                   ))
                 ) : (
                   <p className="text-sm text-gray-600">No logs available</p>
                 )}
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
