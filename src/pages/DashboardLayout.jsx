import { NavLink, Outlet, useNavigate } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Manage Captains", path: "/dashboard/captains" },
  { label: "Coupons", path: "/dashboard/coupons" },
  { label: "Referral", path: "/dashboard/referrals" },
  { label: "Recharges", path: "/dashboard/recharges" },
  { label: "Rides", path: "/dashboard/rides" },
  { label: "Captain Subsidy Payouts", path: "/dashboard/payouts" },
  { label: "Withdrawals", path: "/dashboard/withdrawals" },
];

function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    navigate("/");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100">
      <div className="flex min-h-screen min-w-0">
        <aside className="hidden w-72 shrink-0 flex-col bg-slate-950 px-6 py-8 text-white lg:flex xl:w-80">
          <div className="mb-10">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin Panel</p>
            <h1 className="mt-3 text-3xl font-semibold">Ride App</h1>
            <p className="mt-2 text-sm text-slate-400">Analytics, captain onboarding, coupons, referrals.</p>
          </div>

          <nav className="space-y-2 flex-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                className={({ isActive }) =>
                  `block rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-white text-slate-950 shadow-lg"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 border-t border-slate-800 pt-6">
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center rounded-3xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8 xl:p-10">
          <Outlet />
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/dashboard"}
              className={({ isActive }) =>
                `shrink-0 rounded-3xl px-3 py-2 text-center text-xs font-semibold transition ${
                  isActive ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
