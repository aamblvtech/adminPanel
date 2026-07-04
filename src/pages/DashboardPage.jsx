import { useEffect, useState } from "react";
import api from "../services/api";

function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    try {
      const response = await api.get("/admin/analytics");
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error(error);
      alert("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAnalytics();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  if (loading || !analytics) {
    return (
      <div className="min-h-screen bg-slate-100 p-10">
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow">Loading analytics...</div>
      </div>
    );
  }

  const stats = [
    { label: "Pending captains", value: analytics.pending_captains },
    { label: "Approved captains", value: analytics.approved_captains },
    { label: "Needs correction", value: analytics.needs_correction_captains },
    { label: "Rejected captains", value: analytics.rejected_captains },
    { label: "Suspended captains", value: analytics.suspended_captains },
    { label: "Active coupons", value: analytics.active_coupons },
    { label: "Total coupons", value: analytics.total_coupons },
    { label: "Active referrals", value: analytics.active_referrals },
    { label: "Total referrals", value: analytics.total_referrals },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-7xl mx-auto pb-10">
        <div className="mb-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Dashboard</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-950">Admin analytics</h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-600">Overview of captain onboarding, coupon campaigns, and referral programs in one place.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">{stat.value ?? 0}</p>
            </div>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-950">Analytics details</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-600">Captain onboarding status counts help you prioritize approval workflows and monitor driver availability.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-600">Coupon and referral counts show active promotions, so you can keep campaigns fresh and targeted.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default DashboardPage;
