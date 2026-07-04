import { useEffect, useState } from "react";
import api from "../services/api";

function CouponPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" | "active" | "inactive"
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    startsAt: "",
    expiresAt: "",
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
    const timer = window.setTimeout(() => {
      loadCoupons();
    }, 0);

    return () => window.clearTimeout(timer);
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
        usage_limit: null,
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

  const handleDeleteCoupon = async (couponId, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete the coupon "${code}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/coupons/${couponId}`);
      loadCoupons();
      alert("Coupon deleted successfully.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete coupon.");
    }
  };

  const getCouponStatus = (coupon) => {
    if (!coupon.is_active) {
      return { label: "Inactive", className: "bg-slate-100 text-slate-600 border-slate-200" };
    }

    const now = new Date();

    // Check if scheduled (starts in the future)
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return { label: "Scheduled", className: "bg-blue-50 text-blue-700 border-blue-200" };
    }

    // Check if expired
    if (coupon.expires_at && new Date(coupon.expires_at) < now) {
      return { label: "Expired", className: "bg-rose-50 text-rose-700 border-rose-200" };
    }

    // Check if usage limit reached
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return { label: "Exhausted", className: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    // Check if unique users limit reached
    const uniqueCount = parseInt(coupon.unique_users_count || "0", 10);
    if (coupon.max_unique_users !== null && uniqueCount >= coupon.max_unique_users) {
      return { label: "Exhausted", className: "bg-amber-50 text-amber-700 border-amber-200" };
    }

    return { label: "Active", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const status = getCouponStatus(coupon);
    // Filter by status (case insensitive comparison with label)
    if (statusFilter && status.label.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase().trim();
    const code = (coupon.code || "").toLowerCase();
    const desc = (coupon.description || "").toLowerCase();
    return code.includes(query) || desc.includes(query);
  });

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

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <input
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="20% off on first ride"
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Per-User Usage Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.perUserLimit}
                  onChange={(e) => handleChange("perUserLimit", e.target.value)}
                  placeholder="1"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
                <p className="mt-1 px-1 text-xs text-slate-400">
                  The maximum number of times a single rider can reuse this coupon. Defaults to 1.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Maximum Unique Users Limit</label>
                <input
                  type="number"
                  min="1"
                  value={form.maxUniqueUsers}
                  onChange={(e) => handleChange("maxUniqueUsers", e.target.value)}
                  placeholder="Optional (unlimited)"
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
                <p className="mt-1 px-1 text-xs text-slate-400">
                  The maximum number of distinct customers who can ever claim this coupon.
                </p>
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
        <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Existing coupons</h2>
            <p className="text-sm text-slate-500">
              {loading ? "Loading..." : `${filteredCoupons.length} coupon${filteredCoupons.length === 1 ? "" : "s"}`}
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
                placeholder="Search coupon code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 rounded-3xl border border-slate-200 bg-white pl-10 pr-9 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
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

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="coupon-status-filter" className="text-sm font-semibold text-slate-700 shrink-0">
                Status:
              </label>
              <select
                id="coupon-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-3xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
                <option value="expired">Expired</option>
                <option value="exhausted">Exhausted</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 text-slate-600">Loading coupons...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            {searchQuery || statusFilter
              ? "No coupons match the selected filters."
              : "No coupons created yet."}
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {filteredCoupons.map((coupon) => (
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
                    {(() => {
                      const status = getCouponStatus(coupon);
                      return (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold border ${status.className}`}>
                          {status.label}
                        </span>
                      );
                    })()}
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id, coupon.code)}
                      className="rounded-full bg-red-50 hover:bg-red-100 px-3 py-1 text-xs font-semibold text-red-600 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm text-slate-600">
                  <p>Start: {coupon.starts_at ? new Date(coupon.starts_at).toLocaleString() : "Immediate"}</p>
                  <p>Expiry: {coupon.expires_at ? new Date(coupon.expires_at).toLocaleString() : "None"}</p>
                  <p>Per-User Limit: {coupon.per_user_limit ?? 1}</p>
                  <p>Max Unique Users: {coupon.max_unique_users ?? "Unlimited"} (Used: {coupon.unique_users_count})</p>
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
