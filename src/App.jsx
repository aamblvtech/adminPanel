import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./pages/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import CaptainManagementPage from "./pages/CaptainManagementPage";
import CouponPage from "./pages/CouponPage";
import ReferralPage from "./pages/ReferralPage";
import RechargePage from "./pages/RechargePage";
import PayoutPage from "./pages/PayoutPage";
import WithdrawalPage from "./pages/WithdrawalPage";
import RidesPage from "./pages/RidesPage";
import BroadcastNotificationPage from "./pages/BroadcastNotificationPage";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="captains" element={<CaptainManagementPage />} />
          <Route path="coupons" element={<CouponPage />} />
          <Route path="referrals" element={<ReferralPage />} />
          <Route path="recharges" element={<RechargePage />} />
          <Route path="rides" element={<RidesPage />} />
          <Route path="payouts" element={<PayoutPage />} />
          <Route path="withdrawals" element={<WithdrawalPage />} />
          <Route path="notifications" element={<BroadcastNotificationPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
