"use client";

import React, { useMemo, useRef, useState } from "react";
import { Inter } from "next/font/google";
import {
  GearSix,
  MagnifyingGlass,
  Funnel,
  Printer,
  DownloadSimple,
  ArrowsOutSimple,
  CaretLeft,
  CaretRight,
} from "@phosphor-icons/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

type Row = {
  id: string;
  responsePoint: string;
  location: string;
  population: number;
  risks: {
    flood: number;
    earthquake: number;
    landslide: number;
  };
  assessment: "Stable" | "At Risk" | "Critical";
  team: { name: string; avatarUrl: string }[];
};

const sampleRows: Row[] = [
  {
    id: "1",
    responsePoint: "Jaro National High School",
    location: "Brgy. Tabuc Suba, Jaro",
    population: 12300,
    risks: { flood: 72, earthquake: 18, landslide: 6 },
    assessment: "At Risk",
    team: [
      { name: "A. Cruz", avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg" },
      { name: "M. Santos", avatarUrl: "https://randomuser.me/api/portraits/women/45.jpg" },
      { name: "R. Dela Cruz", avatarUrl: "https://randomuser.me/api/portraits/men/67.jpg" },
    ],
  },
  {
    id: "2",
    responsePoint: "Santa Barbara Plaza",
    location: "Poblacion, Santa Barbara",
    population: 8400,
    risks: { flood: 35, earthquake: 12, landslide: 2 },
    assessment: "Stable",
    team: [
      { name: "J. Reyes", avatarUrl: "https://randomuser.me/api/portraits/men/12.jpg" },
      { name: "K. Garcia", avatarUrl: "https://randomuser.me/api/portraits/women/21.jpg" },
      { name: "L. Cruz", avatarUrl: "https://randomuser.me/api/portraits/men/3.jpg" },
    ],
  },
  {
    id: "3",
    responsePoint: "Balabag Evacuation Center",
    location: "Brgy. Balabag",
    population: 5600,
    risks: { flood: 88, earthquake: 28, landslide: 10 },
    assessment: "Critical",
    team: [
      { name: "P. Rivera", avatarUrl: "https://randomuser.me/api/portraits/women/6.jpg" },
      { name: "D. Flores", avatarUrl: "https://randomuser.me/api/portraits/men/8.jpg" },
      { name: "S. Lim", avatarUrl: "https://randomuser.me/api/portraits/women/9.jpg" },
    ],
  },
  {
    id: "4",
    responsePoint: "Daga Covered Court",
    location: "Brgy. Daga",
    population: 4200,
    risks: { flood: 41, earthquake: 16, landslide: 4 },
    assessment: "Stable",
    team: [
      { name: "N. Uy", avatarUrl: "https://randomuser.me/api/portraits/men/14.jpg" },
      { name: "E. Chua", avatarUrl: "https://randomuser.me/api/portraits/women/15.jpg" },
      { name: "O. Tan", avatarUrl: "https://randomuser.me/api/portraits/men/16.jpg" },
    ],
  },
  {
    id: "5",
    responsePoint: "Delgado Elementary School",
    location: "Brgy. Delgado",
    population: 6900,
    risks: { flood: 58, earthquake: 22, landslide: 7 },
    assessment: "At Risk",
    team: [
      { name: "H. Ramos", avatarUrl: "https://randomuser.me/api/portraits/men/40.jpg" },
      { name: "I. Mendoza", avatarUrl: "https://randomuser.me/api/portraits/women/41.jpg" },
      { name: "J. Bautista", avatarUrl: "https://randomuser.me/api/portraits/men/42.jpg" },
    ],
  },
  {
    id: "6",
    responsePoint: "San Sebastian Multi-Purpose Hall",
    location: "Brgy. San Sebastian",
    population: 7700,
    risks: { flood: 63, earthquake: 24, landslide: 8 },
    assessment: "At Risk",
    team: [
      { name: "K. Villanueva", avatarUrl: "https://randomuser.me/api/portraits/women/48.jpg" },
      { name: "L. Navarro", avatarUrl: "https://randomuser.me/api/portraits/men/49.jpg" },
      { name: "M. Aquino", avatarUrl: "https://randomuser.me/api/portraits/women/50.jpg" },
    ],
  },
  {
    id: "7",
    responsePoint: "Burgos Gymnasium",
    location: "Brgy. Burgos",
    population: 5100,
    risks: { flood: 29, earthquake: 9, landslide: 3 },
    assessment: "Stable",
    team: [
      { name: "R. Vega", avatarUrl: "https://randomuser.me/api/portraits/men/60.jpg" },
      { name: "S. Ortiz", avatarUrl: "https://randomuser.me/api/portraits/women/61.jpg" },
      { name: "T. Sison", avatarUrl: "https://randomuser.me/api/portraits/men/62.jpg" },
    ],
  },
  {
    id: "8",
    responsePoint: "Balic-Balic Covered Court",
    location: "Brgy. Balic-Balic",
    population: 4600,
    risks: { flood: 45, earthquake: 14, landslide: 5 },
    assessment: "Stable",
    team: [
      { name: "U. Go", avatarUrl: "https://randomuser.me/api/portraits/men/70.jpg" },
      { name: "V. Lee", avatarUrl: "https://randomuser.me/api/portraits/women/71.jpg" },
      { name: "W. Yap", avatarUrl: "https://randomuser.me/api/portraits/men/72.jpg" },
    ],
  },
  {
    id: "9",
    responsePoint: "Tabucan Evacuation Site",
    location: "Brgy. Tabucan",
    population: 7300,
    risks: { flood: 74, earthquake: 19, landslide: 6 },
    assessment: "At Risk",
    team: [
      { name: "X. Cruz", avatarUrl: "https://randomuser.me/api/portraits/men/80.jpg" },
      { name: "Y. Santos", avatarUrl: "https://randomuser.me/api/portraits/women/81.jpg" },
      { name: "Z. Reyes", avatarUrl: "https://randomuser.me/api/portraits/men/82.jpg" },
    ],
  },
  {
    id: "10",
    responsePoint: "Bita Norte Barangay Hall",
    location: "Brgy. Bita Norte",
    population: 3900,
    risks: { flood: 33, earthquake: 11, landslide: 4 },
    assessment: "Stable",
    team: [
      { name: "A. Ramos", avatarUrl: "https://randomuser.me/api/portraits/men/83.jpg" },
      { name: "B. Garcia", avatarUrl: "https://randomuser.me/api/portraits/women/84.jpg" },
      { name: "C. Cruz", avatarUrl: "https://randomuser.me/api/portraits/men/85.jpg" },
    ],
  },
  {
    id: "11",
    responsePoint: "Bita Sur Barangay Hall",
    location: "Brgy. Bita Sur",
    population: 4050,
    risks: { flood: 36, earthquake: 12, landslide: 4 },
    assessment: "Stable",
    team: [
      { name: "D. Dizon", avatarUrl: "https://randomuser.me/api/portraits/men/86.jpg" },
      { name: "E. Lim", avatarUrl: "https://randomuser.me/api/portraits/women/87.jpg" },
      { name: "F. Tan", avatarUrl: "https://randomuser.me/api/portraits/men/88.jpg" },
    ],
  },
  {
    id: "12",
    responsePoint: "General Martin Delgado Gym",
    location: "Poblacion",
    population: 9100,
    risks: { flood: 52, earthquake: 17, landslide: 5 },
    assessment: "At Risk",
    team: [
      { name: "G. Bautista", avatarUrl: "https://randomuser.me/api/portraits/men/89.jpg" },
      { name: "H. Aquino", avatarUrl: "https://randomuser.me/api/portraits/women/90.jpg" },
      { name: "I. Mercado", avatarUrl: "https://randomuser.me/api/portraits/men/91.jpg" },
    ],
  },
];

function AssessmentBadge({ status }: { status: Row["assessment"] }) {
  const styles =
    status === "Stable"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "At Risk"
      ? "bg-yellow-50 text-yellow-800 border-yellow-200"
      : "bg-red-50 text-red-700 border-red-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}>
      {status}
    </span>
  );
}

export default function DataTable({ rows = sampleRows }: { rows?: Row[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const sectionRef = useRef<HTMLElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [assessmentFilter, setAssessmentFilter] = useState<
    Set<Row["assessment"]>
  >(new Set(["Stable", "At Risk", "Critical"]));

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    const byText = rows.filter(
      (r) =>
        r.responsePoint.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
    );
    // Apply assessment filter
    return byText.filter((r) => assessmentFilter.has(r.assessment));
  }, [rows, query, assessmentFilter]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const pageRows = filtered.slice(start, end);

  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const printTable = () => {
    try {
      const printWindow = window.open("", "_blank", "width=1200,height=800");
      if (!printWindow) return;
      const html = tableRef.current?.outerHTML || "";
      printWindow.document.write(`<!doctype html><html><head><title>EMERGE Data Table</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          thead { border-bottom: 1px solid #e5e7eb; }
          tbody tr + tr { border-top: 1px solid #e5e7eb; }
          th, td { padding: 8px 12px; font-size: 12px; }
          th { text-align: left; }
        </style>
      </head><body>
        <h2 style="font-weight:700;margin:0 0 8px 0"><span style="color:#b92727">EMERGE</span> Data Table</h2>
        ${html}
        <script>window.onload = function(){window.print(); setTimeout(()=>window.close(), 300);}</script>
      </body></html>`);
      printWindow.document.close();
    } catch {}
  };

  const downloadCSV = () => {
    const headers = [
      "Response Point",
      "Location",
      "Population",
      "Flood Risk",
      "Earthquake Risk",
      "Landslide Risk",
      "Assessment",
    ];
    const rowsCsv = filtered.map((r, idx) => [
      String(idx + 1),
      r.location,
      String(r.population),
      `${r.risks.flood}%`,
      `${r.risks.earthquake}%`,
      `${r.risks.landslide}%`,
      r.assessment,
    ]);
    const csv = [headers, ...rowsCsv]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emerge-data-table.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleFullscreen = async () => {
    const el = sectionRef.current as any;
    if (!document.fullscreenElement && el?.requestFullscreen) {
      await el.requestFullscreen();
    } else if (document.exitFullscreen) {
      await document.exitFullscreen();
    }
  };

  return (
  <section ref={sectionRef as any} className={`mt-0 md:mt-0 px-3 md:px-6 pt-6 md:pt-8 pb-8 ${inter.variable} font-sans bg-white`} id="emerge-data-table">
      {/* Title */}
      <div className="mb-2">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          <span className="text-[#b92727]">EMERGE</span>{" "}
          <span className="text-gray-900">Data Table</span>
        </h2>
        <p className="text-xs md:text-sm text-gray-500">View Response Points, Population, and Hazard Data in a Table</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            <GearSix size={18} weight="bold" />
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 h-9 w-56">
            <MagnifyingGlass size={16} className="text-gray-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="ml-2 flex-1 outline-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400"
              placeholder="Search"
            />
          </div>
          <span className="text-xs font-medium text-red-500">{selected.size} Selected</span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600 relative">
          <span className="hidden sm:inline">{start + 1} - {end} of {total}</span>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              aria-label="Previous page"
            >
              <CaretLeft size={16} />
            </button>
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              aria-label="Next page"
            >
              <CaretRight size={16} />
            </button>
          </div>
          <span className="hidden sm:inline mx-1">|</span>
          <button onClick={() => setIsFilterOpen((s) => !s)} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50" title="Filter">
            <Funnel size={16} />
          </button>
          <button onClick={printTable} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50" title="Print">
            <Printer size={16} />
          </button>
          <button onClick={downloadCSV} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50" title="Download">
            <DownloadSimple size={16} />
          </button>
          <button onClick={toggleFullscreen} className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50" title="Expand">
            <ArrowsOutSimple size={16} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-md shadow p-3 w-48">
              <div className="text-xs font-semibold text-gray-700 mb-2">Filter: Assessment</div>
              {(["Stable", "At Risk", "Critical"] as Row["assessment"][]).map((label) => (
                <label key={label} className="flex items-center gap-2 text-sm text-gray-700 py-1">
                  <input
                    type="checkbox"
                    checked={assessmentFilter.has(label)}
                    onChange={(e) => {
                      setAssessmentFilter((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(label);
                        else next.delete(label);
                        return next;
                      });
                    }}
                  />
                  {label}
                </label>
              ))}
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-xs text-gray-700 px-2 py-1 border rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl shadow-sm bg-white">
        <table ref={tableRef} className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
            <tr className="text-left">
              <th className="px-4 py-3 whitespace-nowrap font-semibold">Response Point</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold">Location</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold text-center">Population</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold text-center text-blue-600">Flood Risk</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold text-center" style={{ color: "#36A816" }}>Earthquake Risk</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold text-center text-amber-600">Landslide Risk</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold text-center">Assessment</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold">Response Team</th>
              <th className="px-4 py-3 whitespace-nowrap font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pageRows.map((row, idx) => (
              <tr
                key={row.id}
                onClick={() => toggleRow(row.id)}
                className={selected.has(row.id) ? "bg-red-50" : undefined}
                aria-selected={selected.has(row.id)}
              >
                <td className="px-4 py-3 text-gray-900 font-medium text-center">{start + idx + 1}</td>
                <td className="px-4 py-3 text-gray-700">{row.location}</td>
                <td className="px-4 py-3 text-gray-900 text-center">{row.population.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-900 text-center">{row.risks.flood}%</td>
                <td className="px-4 py-3 text-gray-900 text-center">{row.risks.earthquake}%</td>
                <td className="px-4 py-3 text-gray-900 text-center">{row.risks.landslide}%</td>
                <td className="px-4 py-3 text-center"><AssessmentBadge status={row.assessment} /></td>
                <td className="px-4 py-3">
                  <div className="flex -space-x-2">
                    {row.team.slice(0, 3).map((m, i) => (
                      <img
                        key={i}
                        src={m.avatarUrl}
                        alt={m.name}
                        title={m.name}
                        className="w-7 h-7 rounded-full ring-2 ring-white object-cover"
                      />
                    ))}
                    {row.team.length > 3 && (
                      <span className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-xs flex items-center justify-center ring-2 ring-white">+{row.team.length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-red-600 hover:text-red-700 font-medium text-xs border border-red-200 rounded-lg px-3 py-1.5 bg-red-50">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
