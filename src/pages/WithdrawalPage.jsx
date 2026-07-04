import { useEffect, useState } from "react";
import api from "../services/api";

function WithdrawalPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(""); // empty string means "all"
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [gatewayRefInput, setGatewayRefInput] = useState("");
  const [errorMsgInput, setErrorMsgInput] = useState("");
  const [activeActionId, setActiveActionId] = useState(null); // request ID currently showing complete/fail input
  const [actionType, setActionType] = useState(""); // 'complete' or 'fail'

  const loadWithdrawals = async (status = "") => {
    try {
      setLoading(true);
      const url = status
        ? `/admin/withdrawals?status=${status}&limit=100`
        : "/admin/withdrawals?limit=100";
      const response = await api.get(url);
      setWithdrawals(response.data.withdrawals || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadWithdrawals(statusFilter);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status, gatewayReference = "", errorMessage = "") => {
    try {
      setProcessingId(id);
      const response = await api.patch(`/admin/withdrawals/${id}`, {
        status,
        gatewayReference: gatewayReference || undefined,
        errorMessage: errorMessage || undefined,
      });

      if (response.data.success) {
        alert(response.data.message || "Withdrawal request updated successfully.");
        // Reset states
        setActiveActionId(null);
        setGatewayRefInput("");
        setErrorMsgInput("");
        loadWithdrawals(statusFilter);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update withdrawal request.");
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-rose-100 text-rose-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-amber-100 text-amber-800";
    }
  };

  const filteredWithdrawals = withdrawals.filter((item) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    const captainName = (item.captain_name || "").toLowerCase();
    const captainPhone = (item.captain_phone || "").toLowerCase();
    const vehicleNum = (item.captain_vehicle_number || "").toLowerCase();
    const refId = (item.gateway_reference || "").toLowerCase();
    const refundId = (item.refund_transaction_id || "").toLowerCase();
    const transferMethod = (item.transfer_method || "").toLowerCase();

    return (
      captainName.includes(query) ||
      captainPhone.includes(query) ||
      vehicleNum.includes(query) ||
      refId.includes(query) ||
      refundId.includes(query) ||
      transferMethod.includes(query)
    );
  });

  return (
    <div className="flex-1">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">Captain Withdrawals</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review and settle S-Coins redemption/withdrawal requests from Captains.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
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
              className="w-64 rounded-3xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
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

          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-sm font-semibold text-slate-700 shrink-0">
              Filter Status:
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="py-12 text-center text-slate-500">Loading withdrawal requests...</div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <p className="text-sm font-medium text-slate-500">
              {searchQuery ? `No matching requests found for "${searchQuery}"` : "No withdrawal requests found."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {filteredWithdrawals.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleString([], {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              const payoutDetails = typeof item.payout_details === "string" 
                ? JSON.parse(item.payout_details) 
                : item.payout_details;

              const isPending = item.status === "pending";
              const isProcessing = item.status === "processing";

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-slate-500">{formattedDate}</span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-lg font-bold text-slate-900">{item.captain_name || "Captain"}</h3>
                      <p className="text-sm text-slate-500">{item.captain_phone || "—"}</p>
                      {item.captain_vehicle_number && (
                        <p className="text-xs text-slate-400 mt-0.5">Vehicle: {item.captain_vehicle_number}</p>
                      )}
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-xs text-slate-500">S-Coins Requested</p>
                        <p className="text-lg font-extrabold text-slate-900">
                          {parseFloat(item.amount_coins).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Payout Amount</p>
                        <p className="text-lg font-extrabold text-emerald-600">
                          ₹{parseFloat(item.amount_rupees).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-4 text-sm">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Transfer Mode: {item.transfer_method.toUpperCase()}
                      </p>
                      {item.transfer_method === "upi" ? (
                        <p className="mt-1 font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded-lg break-all">
                          UPI ID: {payoutDetails?.upiId || payoutDetails?.vpa || "—"}
                        </p>
                      ) : (
                        <div className="mt-1.5 space-y-1 bg-slate-50 p-3 rounded-lg text-xs font-mono text-slate-800">
                          <p>Holder: {payoutDetails?.accountHolderName || "—"}</p>
                          <p>Account: {payoutDetails?.accountNumber || "—"}</p>
                          <p>IFSC: {payoutDetails?.ifsc || "—"}</p>
                        </div>
                      )}
                    </div>

                    {/* Audit Trail Context */}
                    {(item.gateway_reference || item.error_message || item.refund_transaction_id) && (
                      <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600 space-y-1">
                        {item.gateway_reference && (
                          <p>
                            <span className="font-bold">UTR/Ref:</span> {item.gateway_reference}
                          </p>
                        )}
                        {item.error_message && (
                          <p className="text-red-700">
                            <span className="font-bold">Error:</span> {item.error_message}
                          </p>
                        )}
                        {item.refund_transaction_id && (
                          <p>
                            <span className="font-bold text-emerald-800">Refund Tx:</span> {item.refund_transaction_id}
                          </p>
                        )}
                        {item.processed_at && (
                          <p>
                            <span className="font-bold">Processed:</span> {new Date(item.processed_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions Block */}
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    {processingId === item.id ? (
                      <p className="text-center text-sm font-semibold text-slate-600">Processing updates...</p>
                    ) : isPending ? (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleUpdateStatus(item.id, "processing")}
                          className="flex-1 rounded-3xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                        >
                          Mark Processing
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Are you sure you want to reject this withdrawal request? This will refund coins.")) {
                              handleUpdateStatus(item.id, "rejected", "", "Rejected by admin operations");
                            }
                          }}
                          className="flex-1 rounded-3xl border border-red-200 text-red-700 px-4 py-2.5 text-xs font-bold transition hover:bg-red-50"
                        >
                          Reject Request
                        </button>
                      </div>
                    ) : isProcessing ? (
                      <div>
                        {activeActionId === item.id ? (
                          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                            {actionType === "complete" ? (
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Gateway/UTR Reference ID</label>
                                <input
                                  type="text"
                                  placeholder="Enter Transaction Reference No."
                                  value={gatewayRefInput}
                                  onChange={(e) => setGatewayRefInput(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateStatus(item.id, "completed", gatewayRefInput)}
                                    disabled={!gatewayRefInput.trim()}
                                    className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                                  >
                                    Confirm Paid
                                  </button>
                                  <button
                                    onClick={() => setActiveActionId(null)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700">Failure Details / Reason</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Account Closed / Invalid Details"
                                  value={errorMsgInput}
                                  onChange={(e) => setErrorMsgInput(e.target.value)}
                                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium outline-none"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleUpdateStatus(item.id, "failed", "", errorMsgInput)}
                                    disabled={!errorMsgInput.trim()}
                                    className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:opacity-50"
                                  >
                                    Confirm Failed
                                  </button>
                                  <button
                                    onClick={() => setActiveActionId(null)}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setActionType("complete");
                                setActiveActionId(item.id);
                              }}
                              className="flex-1 rounded-3xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
                            >
                              Settle as Completed
                            </button>
                            <button
                              onClick={() => {
                                setActionType("fail");
                                setActiveActionId(item.id);
                              }}
                              className="flex-1 rounded-3xl border border-rose-200 text-rose-700 px-4 py-2.5 text-xs font-bold transition hover:bg-rose-50"
                            >
                              Mark Failed
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default WithdrawalPage;
