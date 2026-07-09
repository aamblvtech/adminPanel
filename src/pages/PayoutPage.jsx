import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";

const formatMoney = (value) => `₹${Number(value || 0).toFixed(2)}`;

function PayoutDestination({ payout }) {
  if (!payout?.payout_details_valid) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
        Missing payout details. Captain must add UPI or bank details before payment.
      </div>
    );
  }

  if (payout.payout_method === "upi") {
    return (
      <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
        {payout.upi_qr_url ? (
          <img src={payout.upi_qr_url} alt="Captain UPI QR" className="h-20 w-20 rounded-lg border border-slate-200 bg-white object-contain" />
        ) : null}
        <div className="min-w-0">
          <p className="font-bold text-slate-500">UPI</p>
          <p className="mt-1 break-all font-mono font-semibold text-slate-900">{payout.upi_id}</p>
          {payout.upi_qr_url ? <p className="mt-1 text-[11px] font-semibold text-emerald-700">QR available</p> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-800">
      <p><span className="font-bold text-slate-500">Holder:</span> {payout.account_holder_name}</p>
      <p className="mt-1"><span className="font-bold text-slate-500">Account:</span> {payout.account_number}</p>
      <p className="mt-1"><span className="font-bold text-slate-500">IFSC:</span> {payout.ifsc}</p>
    </div>
  );
}

function PayoutPage() {
  const [activeTab, setActiveTab] = useState("captains");
  const [summary, setSummary] = useState({ total_pending: 0, total_settled: 0, total_overdue: 0 });
  const [captains, setCaptains] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [totalPayoutsCount, setTotalPayoutsCount] = useState(0);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [settleTarget, setSettleTarget] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [settling, setSettling] = useState(false);
  const transactionFiltersRef = useRef({ search: "", statusFilter: "" });
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
      const filters = transactionFiltersRef.current;
      let url = `/admin/payouts?limit=${limit}&offset=${offset}`;
      if (filters.statusFilter) url += `&status=${filters.statusFilter}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;

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
  }, []);

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

  const openSingleSettle = (payout) => {
    setSettleTarget({ type: "single", payout });
    setPaymentReference("");
    setAdminNote("");
  };

  const openBulkSettle = (captain) => {
    setSettleTarget({ type: "captain", captain });
    setPaymentReference("");
    setAdminNote("");
  };

  const submitSettlement = async () => {
    if (!paymentReference.trim()) {
      alert("Enter UTR/reference before marking this payout paid.");
      return;
    }

    try {
      setSettling(true);
      if (settleTarget.type === "single") {
        await api.post(`/admin/payouts/${settleTarget.payout.id}/settle`, {
          paymentReference: paymentReference.trim(),
          adminNote: adminNote.trim() || undefined,
        });
      } else {
        await api.post("/admin/payouts/settle-captain", {
          captainId: settleTarget.captain.captain_id,
          paymentReference: paymentReference.trim(),
          adminNote: adminNote.trim() || undefined,
        });
      }

      setSettleTarget(null);
      fetchSummary();
      if (activeTab === "transactions") fetchTransactions(page);
    } catch (error) {
      console.error("[PayoutPage] submitSettlement error:", error);
      alert(error.response?.data?.message || "Failed to mark payout paid.");
    } finally {
      setSettling(false);
    }
  };

  const totalPages = Math.ceil(totalPayoutsCount / limit);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl pb-10">
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Finance & Settlement</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Captain Subsidy Payouts</h1>
          <p className="mt-3 max-w-3xl text-sm text-slate-600">
            When riders use coupons or wallet coins, Captains collect reduced cash. Pay the platform subsidy to their saved UPI/bank details within 7 days and record the UTR/reference here.
          </p>
        </div>

        <div className="mb-8 grid gap-6 sm:grid-cols-3">
          <Metric label="Pending Payables" value={loadingSummary ? "..." : formatMoney(summary.total_pending)} hint="Includes blocked payouts missing details" tone="amber" />
          <Metric label="Paid" value={loadingSummary ? "..." : formatMoney(summary.total_settled)} hint="Manual transfers recorded with reference" tone="emerald" />
          <Metric label="Overdue" value={loadingSummary ? "..." : formatMoney(summary.total_overdue)} hint="Past the 7-day payout promise" tone="red" />
        </div>

        <div className="mb-6 flex border-b border-slate-200">
          <TabButton active={activeTab === "captains"} onClick={() => setActiveTab("captains")}>Captain Balances</TabButton>
          <TabButton active={activeTab === "transactions"} onClick={() => setActiveTab("transactions")}>Ride Payout Log</TabButton>
        </div>

        {activeTab === "captains" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Captains Awaiting Subsidy Payment</h2>
                <p className="text-sm text-slate-500">Grouped by captain with saved transfer details.</p>
              </div>
              <button onClick={fetchSummary} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Refresh</button>
            </div>

            {loadingSummary ? (
              <div className="py-12 text-center text-slate-500">Loading captain payout summaries...</div>
            ) : captains.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No pending subsidy balances.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400">
                      <th className="pb-3">Captain</th>
                      <th className="pb-3">Destination</th>
                      <th className="pb-3">Pending Rides</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {captains.map((cap) => (
                      <tr key={cap.captain_id}>
                        <td className="py-4">
                          <div className="font-semibold text-slate-950">{cap.captain_name || "Unknown Captain"}</div>
                          <div className="text-xs text-slate-400">{cap.captain_phone} {cap.captain_vehicle_number && `(${cap.captain_vehicle_type} - ${cap.captain_vehicle_number})`}</div>
                        </td>
                        <td className="py-4"><PayoutDestination payout={cap} /></td>
                        <td className="py-4 font-medium text-slate-600">{cap.pending_count}</td>
                        <td className="py-4 font-bold text-amber-600">{formatMoney(cap.pending_balance)}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => openBulkSettle(cap)}
                            disabled={!cap.payout_details_valid}
                            className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            Mark Paid
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

        {activeTab === "transactions" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ride-Level Subsidy Payouts</h2>
                <p className="text-sm text-slate-500">Each completed discounted ride creates one payable.</p>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); fetchTransactions(1); }} className="flex flex-wrap items-center gap-3">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Captain..." className="min-w-[200px] rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900" />
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-slate-900">
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="blocked">Blocked</option>
                  <option value="paid">Paid</option>
                </select>
                <button type="submit" className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white">Apply</button>
              </form>
            </div>

            {loadingTransactions ? (
              <div className="py-12 text-center text-slate-500">Loading payout log...</div>
            ) : payouts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No matching payout records.</div>
            ) : (
              <div className="space-y-4">
                {payouts.map((p) => {
                  const isOverdue = ["pending", "blocked"].includes(p.status) && new Date() > new Date(p.settle_by);
                  const statusLabel = p.status === "paid" ? "Paid" : p.status === "blocked" ? "Blocked" : isOverdue ? "Overdue" : "Pending";
                  return (
                    <div key={p.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_0.7fr]">
                        <div>
                          <div className="font-semibold text-slate-950">{p.captain_name || "Unknown Captain"}</div>
                          <div className="text-xs text-slate-400">{p.captain_phone} {p.captain_vehicle_number && `(${p.captain_vehicle_type} - ${p.captain_vehicle_number})`}</div>
                          <div className="mt-3 text-xs text-slate-500">
                            <p><span className="font-semibold">Ride:</span> {p.ride_id}</p>
                            <p className="mt-1 truncate"><span className="font-semibold">Pick:</span> {p.pickup_address}</p>
                            <p className="mt-1 truncate"><span className="font-semibold">Drop:</span> {p.drop_address}</p>
                          </div>
                        </div>
                        <PayoutDestination payout={p} />
                        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                          <p>Ride fare: <span className="font-bold text-slate-900">{formatMoney(p.estimated_fare)}</span></p>
                          <p className="mt-1">Cash collected: <span className="font-bold text-slate-900">{formatMoney(p.cash_collected_rupees)}</span></p>
                          <p className="mt-1">Coupon: <span className="font-bold text-slate-900">{formatMoney(p.coupon_subsidy_rupees)}</span></p>
                          <p className="mt-1">Wallet: <span className="font-bold text-slate-900">{formatMoney(p.wallet_subsidy_rupees)}</span></p>
                          <p className="mt-2 text-sm font-bold text-amber-600">Pay: {formatMoney(p.subsidy_rupees)}</p>
                        </div>
                        <div className="flex flex-col items-start justify-between gap-3 lg:items-end">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${p.status === "paid" ? "bg-emerald-100 text-emerald-700" : p.status === "blocked" ? "bg-red-100 text-red-700" : isOverdue ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                            {statusLabel}
                          </span>
                          <div className="text-xs text-slate-500 lg:text-right">
                            <p>Due {new Date(p.settle_by).toLocaleDateString()}</p>
                            {p.paid_at && <p className="mt-1 text-emerald-700">Paid {new Date(p.paid_at).toLocaleDateString()}</p>}
                            {p.payment_reference && <p className="mt-1 font-mono">Ref: {p.payment_reference}</p>}
                          </div>
                          {p.status !== "paid" && (
                            <button onClick={() => openSingleSettle(p)} disabled={!p.payout_details_valid} className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-6">
                    <button onClick={() => fetchTransactions(page - 1)} disabled={page === 1} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">Previous</button>
                    <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
                    <button onClick={() => fetchTransactions(page + 1)} disabled={page === totalPages} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">Next</button>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>

      {settleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-950">Record Manual Payment</h3>
            <p className="mt-2 text-sm text-slate-600">
              Enter the UPI/bank UTR or transaction reference after sending the money.
            </p>
            <label className="mt-5 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">UTR / Reference</span>
              <input value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" placeholder="e.g. 412345678901" />
            </label>
            <label className="mt-4 block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Admin Note</span>
              <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-950" rows={3} placeholder="Optional" />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setSettleTarget(null)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
              <button onClick={submitSettlement} disabled={settling || !paymentReference.trim()} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {settling ? "Saving..." : "Mark Paid"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, hint, tone }) {
  const toneClass = tone === "emerald" ? "text-emerald-500" : tone === "red" ? "text-red-500" : "text-amber-500";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${toneClass}`}>{label}</p>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <span className="mt-2 block text-xs text-slate-400">{hint}</span>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`relative px-6 py-3 text-sm font-semibold transition ${active ? "text-slate-950" : "text-slate-500 hover:text-slate-800"}`}>
      {children}
      {active && <span className="absolute bottom-0 inset-x-6 h-0.5 rounded-full bg-slate-950" />}
    </button>
  );
}

export default PayoutPage;
