import { useEffect, useState } from "react";
import api from "../services/api";

function ReferralPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    rewardType: "credit",
    rewardValue: "",
    minRides: "",
    startsAt: "",
    expiresAt: "",
    description: "",
  });

  const loadPrograms = async () => {
    try {
      const response = await api.get("/admin/referrals");
      setPrograms(response.data.referrals || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load referral programs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code.trim() || !form.rewardValue.trim()) {
      alert("Please provide a referral code and reward value.");
      return;
    }

    try {
      await api.post("/admin/referrals", {
        code: form.code.trim().toUpperCase(),
        reward_type: form.rewardType,
        reward_value: parseFloat(form.rewardValue),
        min_rides: form.minRides ? parseInt(form.minRides, 10) : 0,
        starts_at: form.startsAt || null,
        expires_at: form.expiresAt || null,
        description: form.description.trim() || null,
      });

      setForm({
        code: "",
        rewardType: "credit",
        rewardValue: "",
        minRides: "",
        startsAt: "",
        expiresAt: "",
        description: "",
      });
      loadPrograms();
      alert("Referral program created successfully.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create referral program.");
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Referral</p>
          <h1 className="text-3xl font-semibold text-slate-950">Referral programs</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">Configure referral codes that reward new users and the referrer after successful rides.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Create referral program</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Referral code</label>
              <input
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="INVITE50"
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Reward type</label>
                <select
                  value={form.rewardType}
                  onChange={(e) => handleChange("rewardType", e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="credit">Ride credit</option>
                  <option value="discount">Discount</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Reward value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.rewardValue}
                  onChange={(e) => handleChange("rewardValue", e.target.value)}
                  placeholder="50"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Minimum rides</label>
                <input
                  type="number"
                  min="0"
                  value={form.minRides}
                  onChange={(e) => handleChange("minRides", e.target.value)}
                  placeholder="0"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Reward ₹50 after friend completes first ride"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Start date</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => handleChange("startsAt", e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Expiry date</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => handleChange("expiresAt", e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <button className="inline-flex rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
              Create referral program
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Referral checklist</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>• Use an easy referral code so customers can remember it.</p>
            <p>• Choose credit when you want to reward balance, discount for future ride savings.</p>
            <p>• Add a start date to schedule promotions and expiry to stop outdated campaigns.</p>
            <p>• Set minimum rides to require a successful ride before the reward is applied.</p>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Active referral programs</h2>
          <p className="text-sm text-slate-500">{loading ? "Loading..." : `${programs.length} program${programs.length === 1 ? "" : "s"}`}</p>
        </div>

        {loading ? (
          <div className="mt-6 text-slate-600">Loading referral programs...</div>
        ) : programs.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No referral programs found.</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {programs.map((program) => (
              <div key={program.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{program.code}</p>
                    <p className="text-sm text-slate-600">{program.description || "No description"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {program.reward_type === "credit" ? `Credit ₹${program.reward_value}` : `Discount ₹${program.reward_value}`}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${program.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {program.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
                  <p>Min rides: {program.min_rides ?? 0}</p>
                  <p>Start: {program.starts_at ? new Date(program.starts_at).toLocaleString() : "Immediate"}</p>
                  <p>Expiry: {program.expires_at ? new Date(program.expires_at).toLocaleString() : "None"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ReferralPage;
