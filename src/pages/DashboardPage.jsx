import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const formatMoney = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const safeNumber = (value) => Number(value || 0);

const fetchOptional = async (url, fallback) => {
  try {
    const response = await api.get(url);
    return response.data || fallback;
  } catch (error) {
    console.error(`[DashboardPage] Optional request failed: ${url}`, error);
    return fallback;
  }
};

function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [payoutSummary, setPayoutSummary] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [weekRides, setWeekRides] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const analyticsResponse = await api.get("/admin/analytics");

        const [payoutResponse, withdrawalResponse, weekRideResponse] = await Promise.all([
          fetchOptional("/admin/payouts/summary", { summary: null }),
          fetchOptional("/admin/withdrawals?limit=100", { withdrawals: [] }),
          fetchOptional("/admin/rides/summary?range=week", { summary: null }),
        ]);

        if (!active) return;

        setAnalytics(analyticsResponse.data.analytics);
        setPayoutSummary(payoutResponse.summary || null);
        setWithdrawals(withdrawalResponse.withdrawals || []);
        setWeekRides(weekRideResponse.summary || null);
      } catch (error) {
        console.error("[DashboardPage] loadDashboard error:", error);
        alert("Failed to load dashboard analytics");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const derived = useMemo(() => {
    if (!analytics) return null;

    const pendingWithdrawals = withdrawals.filter((item) => item.status === "pending").length;
    const processingWithdrawals = withdrawals.filter((item) => item.status === "processing").length;
    const pendingPayoutAmount = safeNumber(payoutSummary?.total_pending);
    const overduePayoutAmount = safeNumber(payoutSummary?.total_overdue);
    const onlineCaptains = safeNumber(analytics.online_captains);
    const approvedCaptains = safeNumber(analytics.approved_captains);
    const offlineCaptains = safeNumber(analytics.offline_captains);

    const attentionItems = [
      {
        label: "Captain approvals waiting",
        value: safeNumber(analytics.pending_captains),
        signalCount: safeNumber(analytics.pending_captains),
        href: "/dashboard/captains",
        tone: "amber",
      },
      {
        label: "Corrections requested",
        value: safeNumber(analytics.needs_correction_captains),
        signalCount: safeNumber(analytics.needs_correction_captains),
        href: "/dashboard/captains",
        tone: "blue",
      },
      {
        label: "Overdue subsidy payouts",
        value: formatMoney(overduePayoutAmount),
        signalCount: overduePayoutAmount > 0 ? 1 : 0,
        href: "/dashboard/payouts",
        tone: "red",
      },
      {
        label: "Withdrawal requests pending",
        value: pendingWithdrawals,
        signalCount: pendingWithdrawals,
        href: "/dashboard/withdrawals",
        tone: "emerald",
      },
    ];

    return {
      pendingWithdrawals,
      processingWithdrawals,
      pendingPayoutAmount,
      overduePayoutAmount,
      onlineCaptains,
      offlineCaptains,
      approvedCaptains,
      attentionItems,
    };
  }, [analytics, payoutSummary, withdrawals]);

  if (loading || !analytics || !derived) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl pb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            Loading admin dashboard...
          </div>
        </div>
      </div>
    );
  }

  const attentionCount = derived.attentionItems.reduce((sum, item) => sum + safeNumber(item.signalCount), 0);

  return (
    <div className="min-h-screen min-w-0 bg-slate-100">
      <div className="mx-auto w-full max-w-7xl min-w-0 pb-24 md:pb-10">
        <header className="mb-6 flex min-w-0 flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Admin Overview</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Daily ride performance, live captain supply, onboarding workload, and money that needs admin action.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <QuickLink to="/dashboard/rides">Rides</QuickLink>
            <QuickLink to="/dashboard/captains">Captains</QuickLink>
            <QuickLink to="/dashboard/payouts">Payouts</QuickLink>
          </div>
        </header>

        <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Completed today" value={analytics.completed_rides_today} hint={`${weekRides?.completed_rides ?? 0} completed in last 7 days`} to="/dashboard/rides" />
          <Metric label="Revenue today" value={formatMoney(analytics.gross_revenue_today)} hint={`${formatMoney(weekRides?.gross_revenue)} in last 7 days`} to="/dashboard/rides" />
          <Metric label="Cash collected" value={formatMoney(analytics.cash_collected_today)} hint="Captain-side cash due from rides" tone="emerald" to="/dashboard/rides" />
          <Metric label="Platform subsidy" value={formatMoney(analytics.platform_subsidy_today)} hint="Coupon and wallet subsidy today" tone="amber" to="/dashboard/payouts" />
        </section>

        <section className="mb-5 grid gap-4 md:grid-cols-3">
          <LiveStatusCard label="Online captains" value={derived.onlineCaptains} tone="emerald" to="/dashboard/rides" />
          <LiveStatusCard label="Offline captains" value={derived.offlineCaptains} tone="slate" to="/dashboard/rides" />
          <LiveStatusCard label="Approved captains" value={derived.approvedCaptains} tone="blue" to="/dashboard/captains" />
        </section>

        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Needs Attention</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-950">{attentionCount > 0 ? "Admin action queue" : "No urgent admin queue"}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${attentionCount > 0 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                  {attentionCount > 0 ? `${attentionCount} signals` : "Clear"}
                </span>
                <QuickLink to="/dashboard/captains">View more</QuickLink>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {derived.attentionItems.map((item) => (
                <ActionTile key={item.label} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
          <Panel title="Onboarding" subtitle="Captain verification workload" to="/dashboard/captains">
            <StatusRow label="Pending review" value={analytics.pending_captains} tone="amber" />
            <StatusRow label="Needs correction" value={analytics.needs_correction_captains} tone="blue" />
            <StatusRow label="Approved" value={analytics.approved_captains} tone="emerald" />
            <StatusRow label="Rejected / suspended" value={safeNumber(analytics.rejected_captains) + safeNumber(analytics.suspended_captains)} tone="red" />
          </Panel>

          <Panel title="Finance" subtitle="Settlement exposure" to="/dashboard/payouts">
            <StatusRow label="Pending subsidy payable" value={formatMoney(derived.pendingPayoutAmount)} tone="amber" />
            <StatusRow label="Overdue subsidy payable" value={formatMoney(derived.overduePayoutAmount)} tone="red" />
            <StatusRow label="Pending withdrawals" value={derived.pendingWithdrawals} tone="blue" to="/dashboard/withdrawals" />
            <StatusRow label="Processing withdrawals" value={derived.processingWithdrawals} tone="emerald" to="/dashboard/withdrawals" />
          </Panel>

          <Panel title="Growth" subtitle="Users, coupons, and referrals" to="/dashboard/coupons">
            <StatusRow label="Total users" value={analytics.total_users} tone="blue" />
            <StatusRow label="Active coupons" value={`${analytics.active_coupons} / ${analytics.total_coupons}`} tone="amber" to="/dashboard/coupons" />
            <StatusRow label="Active referrals" value={`${analytics.active_referrals} / ${analytics.total_referrals}`} tone="emerald" to="/dashboard/referrals" />
          </Panel>
        </section>
      </div>
    </div>
  );
}

function QuickLink({ to, children }) {
  return (
    <Link to={to} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-950 hover:text-slate-950">
      {children}
    </Link>
  );
}

function ActionTile({ item }) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-800",
    blue: "bg-blue-50 text-blue-800",
    emerald: "bg-emerald-50 text-emerald-800",
    red: "bg-red-50 text-red-800",
  }[item.tone] || "bg-slate-100 text-slate-700";

  return (
    <Link to={item.href} className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50">
      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
      <p className={`mt-3 w-fit rounded-full px-3 py-1 text-lg font-bold ${toneClass}`}>{item.value}</p>
    </Link>
  );
}

function LiveStatusCard({ label, value, tone, to }) {
  const toneClass = {
    emerald: "text-emerald-600",
    blue: "text-blue-600",
    slate: "text-slate-500",
  }[tone] || "text-slate-500";

  return (
    <Link to={to} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${toneClass}`}>{label}</p>
        <span className="shrink-0 text-xs font-bold text-slate-400">View more</span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
    </Link>
  );
}

function Metric({ label, value, hint, tone = "slate", to }) {
  const toneClass = {
    slate: "text-slate-500",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }[tone];

  return (
    <Link to={to} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className={`break-words text-xs font-semibold uppercase tracking-[0.18em] ${toneClass}`}>{label}</p>
        <span className="shrink-0 text-xs font-bold text-slate-400">View more</span>
      </div>
      <p className="mt-4 break-words text-3xl font-bold text-slate-950">{value ?? 0}</p>
      <p className="mt-2 text-xs font-medium text-slate-400">{hint}</p>
    </Link>
  );
}

function Panel({ title, subtitle, to, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <Link to={to} className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-950 hover:text-slate-950">
          View more
        </Link>
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function StatusRow({ label, value, tone, to }) {
  const toneClass = {
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
  }[tone] || "bg-slate-100 text-slate-700";

  const content = (
    <>
      <span className="text-sm font-semibold text-slate-600">{label}</span>
      <span className={`rounded-full px-3 py-1 text-sm font-bold ${toneClass}`}>{value ?? 0}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
        {content}
      </Link>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      {content}
    </div>
  );
}

export default DashboardPage;
