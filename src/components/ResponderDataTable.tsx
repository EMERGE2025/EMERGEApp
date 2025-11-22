"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
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
  User,
  EnvelopeSimple,
  Phone,
  Lightning,
  MapPin,
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/utils/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

type ResponderStatus = "available" | "assigned" | "unavailable";

type Responder = {
  uid: string;
  name: string;
  email: string;
  role: string;
  locationID: string;
  profilePictureUrl?: string;
  personality?: string;
  skills?: {
    hard: string[];
    soft: string[];
  };
  status?: ResponderStatus;
  contact?: string;
  // Assignment info
  assignedTo?: {
    pointName: string;
    riskType: string;
  };
};

function StatusBadge({ status }: { status: ResponderStatus }) {
  const styles =
    status === "available"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "assigned"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-600 border-gray-200";

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles}`}
    >
      {label}
    </span>
  );
}

function SkillTags({ skills }: { skills: string[] }) {
  const displaySkills = skills.slice(0, 3);
  const remaining = skills.length - 3;

  return (
    <div className="flex flex-wrap gap-1">
      {displaySkills.map((skill, i) => (
        <span
          key={i}
          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
        >
          {skill}
        </span>
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
          +{remaining}
        </span>
      )}
    </div>
  );
}

export default function ResponderDataTable() {
  const { user, userRole, locationID } = useAuth();
  const [responders, setResponders] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const sectionRef = useRef<HTMLElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [riskFilter, setRiskFilter] = useState<Set<string>>(
    new Set(["flooding", "earthquake", "landslide", "unassigned"])
  );

  // Fetch assigned responders from response points across all risk types
  useEffect(() => {
    if (!locationID) {
      setLoading(false);
      return;
    }

    const risks = ["flooding", "earthquake", "landslide"];
    const unsubscribes: (() => void)[] = [];

    // Store assignments: { uid: { pointName, riskType } }
    const assignmentMap = new Map<string, { pointName: string; riskType: string }>();
    // Store all responder data
    let allRespondersData: any[] = [];

    // First, fetch the responders list
    const respondersDocRef = doc(db, locationID, "responders");
    const unsubResponders = onSnapshot(
      respondersDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          allRespondersData = data?.responderList || [];
        }
        updateRespondersList();
      },
      (error) => {
        console.error("Error fetching responders:", error);
      }
    );
    unsubscribes.push(unsubResponders);

    // Then, fetch assignments from each risk type's response points
    risks.forEach((risk) => {
      const pointRef = doc(db, locationID, `responder${risk}`);
      const unsub = onSnapshot(
        pointRef,
        (docSnap) => {
          // Clear existing assignments for this risk type
          assignmentMap.forEach((value, key) => {
            if (value.riskType === risk) {
              assignmentMap.delete(key);
            }
          });

          if (docSnap.exists()) {
            const docData = docSnap.data();

            // Iterate through all response points in this risk document
            Object.entries(docData).forEach(([key, value]: [string, any]) => {
              if (value.type === "Feature" && value.properties) {
                const assignedUIDs = value.properties.assignedResponders || [];
                const pointName = value.properties.name || `Point ${key}`;

                // Map each assigned UID to this point
                assignedUIDs.forEach((uid: string) => {
                  assignmentMap.set(uid, { pointName, riskType: risk });
                });
              }
            });
          }
          updateRespondersList();
        },
        (error) => {
          console.error(`Error fetching ${risk} response points:`, error);
        }
      );
      unsubscribes.push(unsub);
    });

    // Function to update the responders list with all responders and their assignments
    function updateRespondersList() {
      if (allRespondersData.length === 0) {
        setResponders([]);
        setLoading(false);
        return;
      }

      // Map all responders with their assignment info (if any)
      const allResponders: Responder[] = allRespondersData.map((r: any) => {
        const assignment = assignmentMap.get(r.uid);
        return {
          uid: r.uid,
          name: r.name || "Unknown",
          email: r.email || "",
          role: r.role || "responder",
          locationID: r.locationID || locationID,
          profilePictureUrl: r.profilePictureUrl,
          personality: r.personality,
          skills: r.skills || { hard: [], soft: [] },
          status: r.status || "available",
          contact: r.contact || "",
          assignedTo: assignment,
        };
      });

      setResponders(allResponders);
      setLoading(false);
    }

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [locationID]);

  const filtered = useMemo(() => {
    let result = responders;

    // Apply text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.personality?.toLowerCase().includes(q) ||
          r.skills?.hard.some((s) => s.toLowerCase().includes(q)) ||
          r.skills?.soft.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Apply risk type filter
    result = result.filter((r) => {
      if (r.assignedTo) {
        return riskFilter.has(r.assignedTo.riskType);
      } else {
        return riskFilter.has("unassigned");
      }
    });

    return result;
  }, [responders, query, riskFilter]);

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
      printWindow.document
        .write(`<!doctype html><html><head><title>EMERGE Responders</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          thead { border-bottom: 1px solid #e5e7eb; }
          tbody tr + tr { border-top: 1px solid #e5e7eb; }
          th, td { padding: 8px 12px; font-size: 12px; }
          th { text-align: left; }
        </style>
      </head><body>
        <h2 style="font-weight:700;margin:0 0 8px 0"><span style="color:#b92727">EMERGE</span> Responders</h2>
        ${html}
        <script>window.onload = function(){window.print(); setTimeout(()=>window.close(), 300);}</script>
      </body></html>`);
      printWindow.document.close();
    } catch {}
  };

  const downloadCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Role",
      "Assigned Point",
      "Risk Type",
      "Personality",
      "Hard Skills",
      "Soft Skills",
    ];
    const rowsCsv = filtered.map((r) => [
      r.name,
      r.email,
      r.role,
      r.assignedTo?.pointName || "",
      r.assignedTo?.riskType || "",
      r.personality || "",
      r.skills?.hard.join("; ") || "",
      r.skills?.soft.join("; ") || "",
    ]);
    const csv = [headers, ...rowsCsv]
      .map((row) =>
        row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "emerge-responders.csv";
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

  if (loading) {
    return (
      <section
        className={`mt-6 md:mt-10 px-3 md:px-6 ${inter.variable} font-sans`}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading responders...</span>
        </div>
      </section>
    );
  }

  if (!locationID) {
    return (
      <section
        className={`mt-6 md:mt-10 px-3 md:px-6 ${inter.variable} font-sans`}
      >
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          <p className="font-medium">No location assigned</p>
          <p className="text-sm mt-1">
            Please ensure you are logged in and have a location assigned to view
            responders.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef as any}
      className={`mt-6 md:mt-10 px-3 md:px-6 ${inter.variable} font-sans`}
      id="emerge-responders-table"
    >
      {/* Title */}
      <div className="mb-2">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">
          <span className="text-[#b92727]">EMERGE</span>{" "}
          <span className="text-gray-900">Responders</span>
        </h2>
        <p className="text-xs md:text-sm text-gray-500">
          Manage and view all registered responders in your location
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 md:mb-4">
        <div className="flex items-center gap-2 md:gap-3">
          <button className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50">
            <GearSix size={18} weight="bold" />
          </button>
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 h-9 flex-1 sm:flex-none sm:w-56">
            <MagnifyingGlass size={16} className="text-gray-500" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              className="ml-2 flex-1 outline-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400"
              placeholder="Search responders..."
            />
          </div>
          <span className="hidden sm:inline text-xs font-medium text-red-500">
            {selected.size} Selected
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-600 relative">
          <span className="hidden sm:inline">
            {total > 0 ? `${start + 1} - ${end} of ${total}` : "0 responders"}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={current === 1}
              aria-label="Previous page"
            >
              <CaretLeft size={16} />
            </button>
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={current === totalPages}
              aria-label="Next page"
            >
              <CaretRight size={16} />
            </button>
          </div>
          <span className="hidden sm:inline mx-1">|</span>
          <button
            onClick={() => setIsFilterOpen((s) => !s)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
            title="Filter"
          >
            <Funnel size={16} />
          </button>
          <button
            onClick={printTable}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
            title="Print"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={downloadCSV}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
            title="Download"
          >
            <DownloadSimple size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border border-gray-200 hover:bg-gray-50"
            title="Expand"
          >
            <ArrowsOutSimple size={16} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-10 z-10 bg-white border border-gray-200 rounded-md shadow p-3 w-48">
              <div className="text-xs font-semibold text-gray-700 mb-2">
                Filter by Assignment
              </div>
              {["flooding", "earthquake", "landslide", "unassigned"].map((label) => (
                <label
                  key={label}
                  className="flex items-center gap-2 text-sm text-gray-700 py-1 capitalize"
                >
                  <input
                    type="checkbox"
                    checked={riskFilter.has(label)}
                    onChange={(e) => {
                      setRiskFilter((prev) => {
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
        {pageRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <User size={48} weight="thin" className="mb-3 opacity-50" />
            <p className="font-medium">No responders found</p>
            <p className="text-sm mt-1">
              {query
                ? "Try adjusting your search or filters"
                : "Register responders to see them here"}
            </p>
          </div>
        ) : (
          <table ref={tableRef} className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700 border-b border-gray-200">
              <tr className="text-left">
                <th className="px-2 sm:px-4 py-3 whitespace-nowrap font-semibold w-8 sm:w-12">
                  #
                </th>
                <th className="px-2 sm:px-4 py-3 whitespace-nowrap font-semibold">
                  Responder
                </th>
                <th className="hidden md:table-cell px-4 py-3 whitespace-nowrap font-semibold">
                  Contact
                </th>
                <th className="px-2 sm:px-4 py-3 whitespace-nowrap font-semibold">
                  Assigned To
                </th>
                <th className="hidden sm:table-cell px-2 sm:px-4 py-3 whitespace-nowrap font-semibold text-center">
                  Status
                </th>
                <th className="hidden lg:table-cell px-4 py-3 whitespace-nowrap font-semibold">
                  Personality
                </th>
                <th className="hidden xl:table-cell px-4 py-3 whitespace-nowrap font-semibold">
                  Hard Skills
                </th>
                <th className="hidden xl:table-cell px-4 py-3 whitespace-nowrap font-semibold">
                  Soft Skills
                </th>
                <th className="px-2 sm:px-4 py-3 whitespace-nowrap font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pageRows.map((responder, idx) => (
                <tr
                  key={responder.uid}
                  onClick={() => toggleRow(responder.uid)}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selected.has(responder.uid) ? "bg-red-50" : ""
                  }`}
                  aria-selected={selected.has(responder.uid)}
                >
                  <td className="px-2 sm:px-4 py-3 text-gray-500 text-center">
                    {start + idx + 1}
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {responder.profilePictureUrl ? (
                        <img
                          src={responder.profilePictureUrl}
                          alt={responder.name}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-white flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-gray-500 sm:hidden" />
                          <User size={18} className="text-gray-500 hidden sm:block" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {responder.name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {responder.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1 text-gray-700">
                        <EnvelopeSimple size={12} className="text-gray-400" />
                        <span className="text-xs">{responder.email}</span>
                      </div>
                      {responder.contact && (
                        <div className="flex items-center gap-1 text-gray-700">
                          <Phone size={12} className="text-gray-400" />
                          <span className="text-xs">{responder.contact}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3">
                    {responder.assignedTo ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-red-500 flex-shrink-0" />
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {responder.assignedTo.pointName}
                          </span>
                        </div>
                        <span className={`text-xs capitalize ${
                          responder.assignedTo.riskType === "flooding"
                            ? "text-blue-600"
                            : responder.assignedTo.riskType === "earthquake"
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}>
                          {responder.assignedTo.riskType}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Not assigned</span>
                    )}
                  </td>
                  <td className="hidden sm:table-cell px-2 sm:px-4 py-3 text-center">
                    <StatusBadge status={responder.status || "available"} />
                  </td>
                  <td className="hidden lg:table-cell px-4 py-3">
                    {responder.personality ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-50 text-purple-700 border border-purple-200">
                        <Lightning size={12} className="mr-1" />
                        {responder.personality}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="hidden xl:table-cell px-4 py-3">
                    {responder.skills?.hard &&
                    responder.skills.hard.length > 0 ? (
                      <SkillTags skills={responder.skills.hard} />
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="hidden xl:table-cell px-4 py-3">
                    {responder.skills?.soft &&
                    responder.skills.soft.length > 0 ? (
                      <SkillTags skills={responder.skills.soft} />
                    ) : (
                      <span className="text-xs text-gray-400">None</span>
                    )}
                  </td>
                  <td className="px-2 sm:px-4 py-3 text-right">
                    <Link
                      href={`/admin/responders?uid=${responder.uid}`}
                      className="text-red-600 hover:text-red-700 font-medium text-xs border border-red-200 rounded-lg px-2 sm:px-3 py-1.5 bg-red-50 inline-block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-500">
        <span>Total: {responders.length}</span>
        <span className="hidden sm:inline">|</span>
        <span className="text-blue-600">
          {responders.filter((r) => r.assignedTo?.riskType === "flooding").length} Flooding
        </span>
        <span className="text-green-600">
          {responders.filter((r) => r.assignedTo?.riskType === "earthquake").length} Earthquake
        </span>
        <span className="text-amber-600">
          {responders.filter((r) => r.assignedTo?.riskType === "landslide").length} Landslide
        </span>
        <span className="text-gray-500">
          {responders.filter((r) => !r.assignedTo).length} Unassigned
        </span>
      </div>
    </section>
  );
}
