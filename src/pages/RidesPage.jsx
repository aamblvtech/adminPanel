import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const RANGE_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
];

const VIEW_OPTIONS = [
  { label: "Ride Logs", value: "logs" },
  { label: "Online / Offline", value: "captains" },
];

const PAGE_SIZE = 20;

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function RidesPage() {
  const [range, setRange] = useState("today");
  const [summary, setSummary] = useState(null);
  const [availabilitySummary, setAvailabilitySummary] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [rides, setRides] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("logs");
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const loadSummary = useCallback(async (selectedRange) => {
    try {
      setLoadingSummary(true);
      const response = await api.get(`/admin/rides/summary?range=${selectedRange}`);
      setSummary(response.data.summary || null);
    } catch (error) {
      console.error("[RidesPage] loadSummary error:", error);
      alert("Failed to load rides summary");
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const loadRides = useCallback(async (selectedRange, pageNumber = 1, searchQuery = "") => {
    try {
      setLoading(true);
      const offset = (pageNumber - 1) * PAGE_SIZE;
      const encodedSearch = encodeURIComponent(searchQuery.trim());
      const searchParam = encodedSearch ? `&search=${encodedSearch}` : "";
      const response = await api.get(`/admin/rides?range=${selectedRange}&limit=${PAGE_SIZE}&offset=${offset}${searchParam}`);
      setRides(response.data.rides || []);
      setTotal(response.data.total || 0);
      setPage(pageNumber);
    } catch (error) {
      console.error("[RidesPage] loadRides error:", error);
      alert("Failed to load completed rides");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAvailability = useCallback(async (searchQuery = "") => {
    try {
      const encodedSearch = encodeURIComponent(searchQuery.trim());
      const searchParam = encodedSearch ? `?search=${encodedSearch}` : "";
      const response = await api.get(`/admin/captains/availability${searchParam}`);
      setAvailabilitySummary(response.data.summary || null);
      setAvailability(response.data.captains || []);
    } catch (error) {
      console.error("[RidesPage] loadAvailability error:", error);
    }
  }, []);

  useEffect(() => {
    if (activeView !== "logs") return undefined;

    const timer = window.setTimeout(() => {
      loadSummary(range);
      loadRides(range, 1, search);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeView, range, search, loadSummary, loadRides]);

  useEffect(() => {
    if (activeView !== "captains") return undefined;

    const timer = window.setTimeout(() => {
      loadAvailability(search);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [activeView, search, loadAvailability]);

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  const handleRangeChange = (nextRange) => {
    setRange(nextRange);
    setPage(1);
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const searchPlaceholder =
    activeView === "logs"
      ? "Search rider, captain, phone, vehicle, route..."
      : "Search captain, phone, vehicle...";

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-slate-100">
      <div className="mx-auto w-full max-w-7xl min-w-0 pb-24 md:pb-10">
        <div className="mb-5 border-b border-slate-200 pb-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Ride Operations</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Rides</h1>
          </div>
        </div>

        <div className="mb-5 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid w-full grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm lg:w-[420px] lg:shrink-0">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveView(option.value)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  activeView === option.value
                    ? "bg-slate-950 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:max-w-xl">
            <input
              value={search}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-950"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-xs font-bold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                type="button"
                aria-label="Clear search"
              >
                X
              </button>
            ) : null}
          </div>
        </div>

        {activeView === "logs" ? (
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Completed ride log</h2>
                <p className="text-sm text-slate-500">
                  {total} ride{total === 1 ? "" : "s"}{search ? ` matching "${search}"` : ""}
                </p>
              </div>
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
                <div className="grid w-full grid-cols-3 rounded-2xl border border-slate-200 bg-slate-50 p-1 sm:w-[360px]">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleRangeChange(option.value)}
                      className={`min-w-0 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        range === option.value
                          ? "bg-slate-950 text-white shadow-sm"
                          : "text-slate-600 hover:bg-white hover:text-slate-950"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    loadSummary(range);
                    loadRides(range, page, search);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mb-5 grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              <Metric label="Completed rides" value={loadingSummary ? "..." : summary?.completed_rides ?? 0} />
              <Metric label="Gross revenue" value={loadingSummary ? "..." : formatMoney(summary?.gross_revenue)} />
              <Metric label="Cash collected" value={loadingSummary ? "..." : formatMoney(summary?.cash_collected)} />
              <Metric label="Platform subsidy" value={loadingSummary ? "..." : formatMoney(summary?.platform_subsidy)} />
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading completed rides...</div>
            ) : rides.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                No completed rides found.
              </div>
            ) : (
              <>
                <div className="max-w-full overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                        <th className="px-3 py-3">Ride</th>
                        <th className="px-3 py-3">Rider</th>
                        <th className="px-3 py-3">Captain</th>
                        <th className="px-3 py-3">Route</th>
                        <th className="px-3 py-3">Fare</th>
                        <th className="px-3 py-3">Cash</th>
                        <th className="px-3 py-3">Subsidy</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rides.map((ride) => {
                        const subsidy = Number(ride.discount_amount || 0) + Number(ride.wallet_coins_deduction || 0) / 2;

                        return (
                          <tr key={ride.id} className="align-top">
                            <td className="px-3 py-4">
                              <p className="font-mono text-xs font-semibold text-slate-900">{ride.id.slice(0, 8)}</p>
                              <p className="mt-1 text-xs text-slate-500">{formatDateTime(ride.created_at)}</p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="font-semibold text-slate-950">{ride.rider_name || "Rider"}</p>
                              <p className="mt-1 text-xs text-slate-500">{ride.rider_phone || "-"}</p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="font-semibold text-slate-950">{ride.captain_name || "Captain"}</p>
                              <p className="mt-1 text-xs text-slate-500">{ride.captain_phone || "-"}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                {[ride.captain_vehicle_type || ride.vehicle_type, ride.captain_vehicle_number].filter(Boolean).join(" / ") || "-"}
                              </p>
                            </td>
                            <td className="px-3 py-4">
                              <p className="max-w-xs truncate text-xs text-slate-700"><span className="font-semibold">From:</span> {ride.pickup_address}</p>
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-700"><span className="font-semibold">To:</span> {ride.drop_address}</p>
                              <p className="mt-1 text-xs text-slate-400">{ride.distance_km ? `${ride.distance_km.toFixed(2)} km` : "Distance -"}</p>
                            </td>
                            <td className="px-3 py-4 font-bold text-slate-950">{formatMoney(ride.final_fare)}</td>
                            <td className="px-3 py-4 font-semibold text-emerald-700">{formatMoney(ride.cash_amount_due)}</td>
                            <td className="px-3 py-4">
                              <p className="font-semibold text-amber-700">{formatMoney(subsidy)}</p>
                              <p className="mt-1 text-xs text-slate-400">
                                Discount {formatMoney(ride.discount_amount)} | Wallet {formatMoney(ride.wallet_coins_deduction / 2)}
                              </p>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
                  <button
                    onClick={() => loadRides(range, page - 1, search)}
                    disabled={page <= 1}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-slate-500">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => loadRides(range, page + 1, search)}
                    disabled={page >= totalPages}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-slate-950">Online / Offline Captains</h2>
                <div className="flex gap-2 text-xs font-bold">
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">{availabilitySummary?.online_captains ?? 0} online</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">{availabilitySummary?.offline_captains ?? 0} offline</span>
                </div>
              </div>
            </div>

            {availability.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                No captains found.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {availability.map((captain) => (
                  <div key={captain.captain_id} className="rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950">{captain.name || "Captain"}</p>
                        <p className="mt-1 text-xs text-slate-500">{captain.phone || "-"}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                          captain.availability_status === "online"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {captain.availability_status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600">
                      {[captain.vehicle_type, captain.vehicle_number].filter(Boolean).join(" / ") || "Vehicle -"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Last heartbeat: {captain.last_seen_at ? formatDateTime(captain.last_seen_at) : "Not available"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

function Metric({ label, value, tone = "slate" }) {
  const toneClass = tone === "emerald" ? "text-emerald-600" : "text-slate-500";

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className={`break-words text-xs font-semibold uppercase tracking-[0.2em] ${toneClass}`}>{label}</p>
      <p className="mt-4 break-words text-3xl font-bold text-slate-950">{value}</p>
    </div>
  );
}

export default RidesPage;
