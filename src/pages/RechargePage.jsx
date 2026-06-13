import { useEffect, useState } from "react";
import api from "../services/api";

function RechargePage() {
  const [recharges, setRecharges] = useState([]);
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [captainsLoading, setCaptainsLoading] = useState(true);
  const [filterCaptainId, setFilterCaptainId] = useState("");
  
  const [form, setForm] = useState({
    captainId: "",
    planType: "daily",
  });

  const loadRecharges = async (captainId = "") => {
    try {
      setLoading(true);
      const url = captainId 
        ? `/admin/recharges?captainId=${captainId}` 
        : "/admin/recharges";
      const response = await api.get(url);
      setRecharges(response.data.recharges || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load recharges");
    } finally {
      setLoading(false);
    }
  };

  const loadCaptains = async () => {
    try {
      setCaptainsLoading(true);
      const response = await api.get("/admin/captains");
      setCaptains(response.data.captains || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load captains");
    } finally {
      setCaptainsLoading(false);
    }
  };

  useEffect(() => {
    loadRecharges();
    loadCaptains();
  }, []);

  const handleFilterChange = (captainId) => {
    setFilterCaptainId(captainId);
    loadRecharges(captainId);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleGrantRecharge = async (event) => {
    event.preventDefault();

    if (!form.captainId) {
      alert("Please select a captain to grant the recharge to.");
      return;
    }

    try {
      await api.post("/admin/recharges/grant", {
        captainId: form.captainId,
        planType: form.planType,
      });

      setForm((prev) => ({ ...prev, captainId: "" }));
      loadRecharges(filterCaptainId);
      alert("Recharge granted successfully.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to grant recharge.");
    }
  };

  const handleRevokeRecharge = async (rechargeId) => {
    if (!window.confirm("Are you sure you want to revoke this active recharge immediately?")) {
      return;
    }

    try {
      await api.patch(`/admin/recharges/${rechargeId}/revoke`);
      loadRecharges(filterCaptainId);
      alert("Recharge revoked successfully.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to revoke recharge.");
    }
  };

  const getPlanBadgeClass = (planType) => {
    switch (planType) {
      case "daily":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "weekly":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "monthly":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Payments & Recharges</p>
          <h1 className="text-3xl font-semibold text-slate-950">Prepaid Recharges</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Grant manual promotional passes to captains, view payment logs, and revoke active plans.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        {/* GRANT MANUAL RECHARGE */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
          <h2 className="text-xl font-semibold text-slate-900">Grant Manual Pass</h2>
          <p className="mt-1 text-sm text-slate-500">
            Grant a promotional pass to a captain. This starts immediately or stacks after their current plan.
          </p>
          <form onSubmit={handleGrantRecharge} className="mt-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700">Select Captain</label>
              <select
                value={form.captainId}
                onChange={(e) => handleChange("captainId", e.target.value)}
                disabled={captainsLoading}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900 disabled:opacity-50"
              >
                <option value="">-- Choose a Captain --</option>
                {captains.map((cap) => (
                  <option key={cap.id} value={cap.user_id}>
                    {cap.full_name} ({cap.vehicle_type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Plan Type</label>
              <select
                value={form.planType}
                onChange={(e) => handleChange("planType", e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              >
                <option value="daily">Daily Pass — ₹32</option>
                <option value="weekly">Weekly Pass — ₹250</option>
                <option value="monthly">Monthly Pass — ₹900</option>
              </select>
            </div>

            <button
              type="submit"
              className="inline-flex rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none"
            >
              Grant Pass
            </button>
          </form>
        </section>

        {/* GUIDANCE & INFO */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Recharge Policies</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>• <strong>Stacking support</strong>: If a captain has a plan active, granting a new plan will start after the active plan expires.</p>
            <p>• <strong>Revocation</strong>: Revoking a plan immediately changes its expiry to the current time, blocking the driver from going online.</p>
            <p>• <strong>Pricing model</strong>: Plan amounts are computed server-side including 18% GST (Daily total: ₹37.76, Weekly: ₹295.00, Monthly: ₹1062.00).</p>
            <p>• <strong>Role constraint</strong>: Only captains with approved profile status can go online, even with active recharges.</p>
          </div>
        </section>
      </div>

      {/* TRANSACTION LIST */}
      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Recharge & Payment Logs</h2>
            <p className="text-sm text-slate-500">History of all prepaid passes and admin grants.</p>
          </div>
          
          {/* Captain filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Filter Captain:</label>
            <select
              value={filterCaptainId}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            >
              <option value="">All Captains</option>
              {captains.map((cap) => (
                <option key={cap.id} value={cap.user_id}>
                  {cap.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-center text-slate-600 py-8">Loading recharge logs...</div>
        ) : recharges.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            No recharge records found.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Captain</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Pricing (Total)</th>
                  <th className="pb-3 font-semibold">Validity Dates</th>
                  <th className="pb-3 font-semibold">Source</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {recharges.map((rec) => {
                  const isCurrentlyActive = rec.status === "active" && new Date(rec.expires_at) > new Date();
                  
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4">
                        <div className="font-semibold text-slate-950">
                          {rec.captain_name || "Unknown Captain"}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {rec.captain_phone}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getPlanBadgeClass(rec.plan_type)}`}>
                          {rec.plan_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="font-semibold text-slate-900">₹{parseFloat(rec.total_amount).toFixed(2)}</div>
                        <div className="text-xs text-slate-400">Base: ₹{parseFloat(rec.base_amount).toFixed(2)} + GST</div>
                      </td>
                      <td className="py-4 text-xs text-slate-600">
                        <div><span className="text-slate-400">Start:</span> {new Date(rec.starts_at).toLocaleString()}</div>
                        <div className="mt-1"><span className="text-slate-400">End:</span> {new Date(rec.expires_at).toLocaleString()}</div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${rec.created_by === "admin" ? "bg-amber-100 text-amber-800" : "bg-purple-100 text-purple-800"}`}>
                          {rec.created_by.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isCurrentlyActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                          {isCurrentlyActive ? "Active" : rec.status === "active" ? "Expired" : rec.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {isCurrentlyActive && (
                          <button
                            onClick={() => handleRevokeRecharge(rec.id)}
                            className="inline-flex items-center justify-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default RechargePage;
