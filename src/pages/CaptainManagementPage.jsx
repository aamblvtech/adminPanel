import { useEffect, useState } from "react";
import api from "../services/api";
import CaptainCard from "../components/CaptainCard";

function CaptainManagementPage() {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "pending" | "approved" | "rejected"

  const getCaptains = async () => {
    try {
      setLoading(true);
      const response = await api.get("/admin/captains");
      setCaptains(response.data.captains || []);
    } catch (error) {
      console.error(error);
      alert("Unable to load captains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCaptains();
  }, []);

  const counts = {
    all: captains.length,
    pending: captains.filter((c) => c.status !== "approved" && c.status !== "rejected").length,
    approved: captains.filter((c) => c.status === "approved").length,
    rejected: captains.filter((c) => c.status === "rejected").length,
  };

  const filteredCaptains = captains.filter((c) => {
    // Status filter
    if (statusFilter === "pending") {
      if (c.status === "approved" || c.status === "rejected") return false;
    } else if (statusFilter && c.status !== statusFilter) {
      return false;
    }

    // Search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    const name = (c.full_name || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const vehicleNum = (c.vehicle_number || "").toLowerCase();
    const vehicleType = (c.vehicle_type || "").toLowerCase();

    return (
      name.includes(query) ||
      phone.includes(query) ||
      vehicleNum.includes(query) ||
      vehicleType.includes(query)
    );
  });

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Manage</p>
          <h1 className="text-3xl font-semibold text-slate-950">Captain Verification</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Review pending captain onboarding requests, approve or reject them, and monitor their current status.
          </p>
        </div>
      </div>

      {/* Search and Status Filters */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Tabs */}
        <div className="flex flex-wrap border-b border-slate-100 pb-1 sm:pb-0 sm:border-none gap-2">
          {[
            { id: "", label: "All", count: counts.all },
            { id: "pending", label: "Pending", count: counts.pending, color: "text-amber-600 bg-amber-50" },
            { id: "approved", label: "Approved", count: counts.approved, color: "text-emerald-600 bg-emerald-50" },
            { id: "rejected", label: "Rejected", count: counts.rejected, color: "text-rose-600 bg-rose-50" },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all outline-none ${
                  isActive
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? "bg-white/20 text-white" : tab.color || "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search name, phone, vehicle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72 rounded-3xl border border-slate-200 bg-white pl-10 pr-9 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow-sm border border-slate-200">
          Loading captains...
        </div>
      ) : filteredCaptains.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-500 shadow-sm border border-slate-200">
          {searchQuery || statusFilter
            ? "No captains found matching the selected filters."
            : "No captains found."}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCaptains.map((captain) => (
            <CaptainCard key={captain.id} captain={captain} refreshCaptains={getCaptains} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CaptainManagementPage;
