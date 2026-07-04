import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

function PayoutPage() {
  const [activeTab, setActiveTab] = useState("captains"); // "captains" or "transactions"
  const [summary, setSummary] = useState({ total_pending: 0, total_settled: 0, total_overdue: 0 });
  const [captains, setCaptains] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [totalPayoutsCount, setTotalPayoutsCount] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" (all), "pending", "settled"
  const transactionFiltersRef = useRef({ search: "", statusFilter: "" });
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const response = await api.get("/admin/payouts/summary");
      if (response.data.success) {
        setSummary(response.data.summary);
        setCaptains(response.data.captains || []);
      }
    } catch (error) {
      console.error("[PayoutPage] fetchSummary error:", error);
      alert("Failed to load payout summary stats.");
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    transactionFiltersRef.current = { search, statusFilter };
  }, [search, statusFilter]);

  const fetchTransactions = useCallback(async (pageNumber = 1) => {
    try {
      setLoadingTransactions(true);
      const offset = (pageNumber - 1) * limit;
      let url = `/admin/payouts?limit=${limit}&offset=${offset}`;
      const filters = transactionFiltersRef.current;
      
      if (filters.statusFilter) {
        url += `&status=${filters.statusFilter}`;
      }
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }

      const response = await api.get(url);
      if (response.data.success) {
        setPayouts(response.data.payouts || []);
        setTotalPayoutsCount(response.data.total || 0);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error("[PayoutPage] fetchTransactions error:", error);
      alert("Failed to load payout transactions.");
    } finally {
      setLoadingTransactions(false);
    }
  }, [limit]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchSummary();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "transactions") {
      const timer = window.setTimeout(() => {
        fetchTransactions(1);
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [activeTab, statusFilter, fetchTransactions]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  const handleSettleSingle = async (payoutId) => {
    if (!window.confirm("Are you sure you want to mark this individual payout as settled/paid?")) {
      return;
    }
    try {
      const response = await api.post(`/admin/payouts/${payoutId}/settle`);
      if (response.data.success) {
        alert(response.data.message || "Payout settled successfully!");
        fetchSummary();
        if (activeTab === "transactions") {
          fetchTransactions(page);
        }
      }
    } catch (error) {
      console.error("[PayoutPage] handleSettleSingle error:", error);
      alert(error.response?.data?.message || "Failed to settle payout.");
    }
  };

  const handleSettleCaptain = async (captainId, captainName, amount) => {
    const confirmMessage = `Have you completed the offline bank or UPI transfer of ₹${amount.toFixed(2)} to ${captainName || "this Captain"}?\n\nClick OK to mark all their pending payouts as settled.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      const response = await api.post("/admin/payouts/settle-captain", { captainId });
      if (response.data.success) {
        alert(response.data.message || "Captain payouts settled successfully!");
        fetchSummary();
        if (activeTab === "transactions") {
          fetchTransactions(page);
        }
      }
    } catch (error) {
      console.error("[PayoutPage] handleSettleCaptain error:", error);
      alert(error.response?.data?.message || "Failed to settle captain payouts.");
    }
  };

  const totalPages = Math.ceil(totalPayoutsCount / limit);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto pb-10">
        
        {/* Header Section */}
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Finance & Settlement</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Payouts & Platform Subsidy</h1>
          <p className="mt-3 text-sm text-slate-600 max-w-3xl">
            Riders pay using coupons or wallet coins which discount the cash amount due to Captains. The platform reimburses Captains for this subsidy. Mark payouts as settled once UPI or bank transfers are done.
          </p>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid gap-6 sm:grid-cols-3 mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">Outstanding Pending Payouts</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                ₹{loadingSummary ? "..." : summary.total_pending.toFixed(2)}
              </p>
            </div>
            <span className="mt-2 text-xs text-slate-400">Platform needs to pay this to captains</span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Total Paid/Settled</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                ₹{loadingSummary ? "..." : summary.total_settled.toFixed(2)}
              </p>
            </div>
            <span className="mt-2 text-xs text-slate-400">Reimbursements already settled</span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-500">Overdue (7+ Days Pending)</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">
                ₹{loadingSummary ? "..." : summary.total_overdue.toFixed(2)}
              </p>
            </div>
            <span className="mt-2 text-xs text-slate-400">Urgent settlements required</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("captains")}
            className={`py-3 px-6 font-semibold text-sm transition-colors relative ${
              activeTab === "captains"
                ? "text-slate-950"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Captain Payout Balances
            {activeTab === "captains" && (
              <span className="absolute bottom-0 inset-x-6 h-0.5 bg-slate-950 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`py-3 px-6 font-semibold text-sm transition-colors relative ${
              activeTab === "transactions"
                ? "text-slate-950"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Payout Transactions Log
            {activeTab === "transactions" && (
              <span className="absolute bottom-0 inset-x-6 h-0.5 bg-slate-950 rounded-full" />
            )}
          </button>
        </div>

        {/* TAB 1: CAPTAINS LIST (Grouped Payouts) */}
        {activeTab === "captains" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Captains Owed Subsidies</h2>
                <p className="text-sm text-slate-500">Grouped list of drivers awaiting platform reimbursements.</p>
              </div>
              <button 
                onClick={fetchSummary}
                className="rounded-3xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Refresh
              </button>
            </div>

            {loadingSummary ? (
              <div className="py-12 text-center text-slate-500">Loading captain payout summaries...</div>
            ) : captains.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                No captains currently have outstanding pending balances! Everything is settled.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Captain Info</th>
                      <th className="pb-3 font-semibold">Pending Rides</th>
                      <th className="pb-3 font-semibold">Owed Amount</th>
                      <th className="pb-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                    {captains.map((cap) => (
                      <tr key={cap.captain_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4">
                          <div className="font-semibold text-slate-950">{cap.captain_name || "Unknown Captain"}</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {cap.captain_phone} {cap.captain_vehicle_number && `(${cap.captain_vehicle_type} - ${cap.captain_vehicle_number})`}
                          </div>
                        </td>
                        <td className="py-4 text-slate-600 font-medium">
                          {cap.pending_count} ride{cap.pending_count > 1 ? "s" : ""}
                        </td>
                        <td className="py-4">
                          <div className="text-base font-bold text-amber-600">₹{cap.pending_balance.toFixed(2)}</div>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleSettleCaptain(cap.captain_id, cap.captain_name, cap.pending_balance)}
                            className="inline-flex rounded-3xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                          >
                            Settle Balance
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: DETAILED TRANSACTION LOG */}
        {activeTab === "transactions" && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* Search & Filter Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-6 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Individual Payout Logs</h2>
                <p className="text-sm text-slate-500">View and settle individual ride reimbursement transactions.</p>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Search Captain Name / Phone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-900 min-w-[200px]"
                />
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="settled">Settled</option>
                </select>

                <button
                  type="submit"
                  className="rounded-3xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
                >
                  Apply Filters
                </button>
              </form>
            </div>

            {loadingTransactions ? (
              <div className="py-12 text-center text-slate-500">Loading transactions log...</div>
            ) : payouts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
                No matching payout transactions found.
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Captain</th>
                        <th className="pb-3 font-semibold">Ride Details</th>
                        <th className="pb-3 font-semibold">Fare & Subsidy</th>
                        <th className="pb-3 font-semibold">Validity / Timeline</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                      {payouts.map((p) => {
                        const isOverdue = p.status === "pending" && new Date() > new Date(p.settle_by);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4">
                             <div className="font-semibold text-slate-950">{p.captain_name || "Unknown Captain"}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {p.captain_phone} {p.captain_vehicle_number && `(${p.captain_vehicle_type} - ${p.captain_vehicle_number})`}
                              </div>
                            </td>
                            <td className="py-4 text-xs max-w-[220px] truncate">
                              <div className="text-slate-500 font-semibold mb-0.5">Ride: {p.ride_id.slice(0, 8)}...</div>
                              <div className="truncate"><span className="text-slate-400 font-medium">Pick:</span> {p.pickup_address}</div>
                              <div className="truncate mt-0.5"><span className="text-slate-400 font-medium">Drop:</span> {p.drop_address}</div>
                            </td>
                            <td className="py-4">
                              <div className="font-bold text-amber-600">Reimburse: ₹{p.subsidy_rupees.toFixed(2)}</div>
                              <div className="text-xs text-slate-400 mt-0.5">Est. Fare: ₹{p.estimated_fare.toFixed(2)}</div>
                            </td>
                            <td className="py-4 text-xs text-slate-600">
                              <div><span className="text-slate-400">Created:</span> {new Date(p.created_at).toLocaleDateString()}</div>
                              <div className="mt-1">
                                <span className="text-slate-400">Settle By:</span>{" "}
                                <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                                  {new Date(p.settle_by).toLocaleDateString()}
                                </span>
                              </div>
                              {p.settled_at && (
                                <div className="mt-1 text-emerald-600 font-medium">
                                  Paid: {new Date(p.settled_at).toLocaleDateString()}
                                </div>
                              )}
                            </td>
                            <td className="py-4">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                p.status === "settled" 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : isOverdue 
                                    ? "bg-red-100 text-red-700 animate-pulse" 
                                    : "bg-amber-100 text-amber-700"
                              }`}>
                                {p.status === "settled" ? "Settled" : isOverdue ? "Overdue" : "Pending"}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              {p.status === "pending" && (
                                <button
                                  onClick={() => handleSettleSingle(p.id)}
                                  className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-200 transition"
                                >
                                  Settle
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-6">
                    <button
                      onClick={() => fetchTransactions(page - 1)}
                      disabled={page === 1}
                      className="rounded-3xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-xs text-slate-500">
                      Page {page} of {totalPages} ({totalPayoutsCount} total records)
                    </span>
                    <button
                      onClick={() => fetchTransactions(page + 1)}
                      disabled={page === totalPages}
                      className="rounded-3xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default PayoutPage;
