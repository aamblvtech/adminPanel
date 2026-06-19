import { useEffect, useState } from "react";
import api from "../services/api";

function CouponPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    startsAt: "",
    expiresAt: "",
    usageLimit: "",
    description: "",
    perUserLimit: "1",
    maxUniqueUsers: "",
  });

  const loadCoupons = async () => {
    try {
      const response = await api.get("/admin/coupons");
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.code.trim() || !form.discountValue.trim()) {
      alert("Please provide a coupon code and discount value.");
      return;
    }

    try {
      await api.post("/admin/coupons", {
        code: form.code.trim().toUpperCase(),
        discount_type: form.discountType,
        discount_value: parseFloat(form.discountValue),
        starts_at: form.startsAt || null,
        expires_at: form.expiresAt || null,
        usage_limit: form.usageLimit ? parseInt(form.usageLimit, 10) : null,
        description: form.description.trim() || null,
        per_user_limit: form.perUserLimit ? parseInt(form.perUserLimit, 10) : 1,
        max_unique_users: form.maxUniqueUsers ? parseInt(form.maxUniqueUsers, 10) : null,
      });

      setForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        startsAt: "",
        expiresAt: "",
        usageLimit: "",
        description: "",
        perUserLimit: "1",
        maxUniqueUsers: "",
      });
      loadCoupons();
      alert("Coupon created successfully.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create coupon.");
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Coupons</p>
          <h1 className="text-3xl font-semibold text-slate-950">Create and manage coupons</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">Add discount codes with start/end dates, usage limits, and activation details.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">New coupon</h2>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Coupon code</label>
              <input
                value={form.code}
                onChange={(e) => handleChange("code", e.target.value)}
                placeholder="SAVE20"
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Discount type</label>
                <select
                  value={form.discountType}
                  onChange={(e) => handleChange("discountType", e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Discount value</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountValue}
                  onChange={(e) => handleChange("discountValue", e.target.value)}
                  placeholder="20"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Usage limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  onChange={(e) => handleChange("usageLimit", e.target.value)}
                  placeholder="Leave empty for unlimited"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="20% off on first ride"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Per-user limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.perUserLimit}
                  onChange={(e) => handleChange("perUserLimit", e.target.value)}
                  placeholder="1"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Users Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUniqueUsers}
                  onChange={(e) => handleChange("maxUniqueUsers", e.target.value)}
                  placeholder="Leave empty for unlimited"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>
            </div>

            <button
              className="inline-flex rounded-3xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Create coupon
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Coupon checklist</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>• Use an uppercase coupon code to avoid duplicates and confusion.</p>
            <p>• Choose percentage for percent discounts, fixed for currency discounts.</p>
            <p>• Leave start date blank to activate immediately.</p>
            <p>• Leave expiry blank for an open-ended coupon.</p>
            <p>• Usage limit controls how many times the coupon can be redeemed.</p>
          </div>
        </section>
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Existing coupons</h2>
          <p className="text-sm text-slate-500">{loading ? "Loading..." : `${coupons.length} coupon${coupons.length === 1 ? "" : "s"}`}</p>
        </div>

        {loading ? (
          <div className="mt-6 text-slate-600">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No coupons created yet.</div>
        ) : (
          <div className="mt-6 grid gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-950">{coupon.code}</p>
                    <p className="text-sm text-slate-600">{coupon.description || "No description"}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                      {coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : `₹${coupon.discount_value}`}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${coupon.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
                  <p>Start: {coupon.starts_at ? new Date(coupon.starts_at).toLocaleString() : "Immediate"}</p>
                  <p>Expiry: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleString() : "None"}</p>
                  <p>Usage Limit: {coupon.usage_limit ?? "Unlimited"} (Used: {coupon.used_count})</p>
                  <p>Per-User Limit: {coupon.per_user_limit ?? 1}</p>
                  <p>Max Users Limit: {coupon.max_unique_users ?? "Unlimited"} (Used: {coupon.unique_users_count})</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default CouponPage;
