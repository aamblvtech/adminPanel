import { useEffect, useState } from "react";
import api from "../services/api";
import CaptainCard from "../components/CaptainCard";

function CaptainManagementPage() {
  const [captains, setCaptains] = useState([]);
  const [loading, setLoading] = useState(true);

  const getCaptains = async () => {
    try {
      const response = await api.get("/admin/captains");
      setCaptains(response.data.captains);
    } catch (error) {
      console.error(error);
      alert("Unable to load captains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCaptains();
  }, []);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Manage</p>
          <h1 className="text-3xl font-semibold text-slate-950">Captain Verification</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">Review pending captain onboarding requests, approve or reject them, and monitor their current status.</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow">Loading captains...</div>
      ) : captains.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-slate-600 shadow">No captains found.</div>
      ) : (
        <div className="space-y-5">
          {captains.map((captain) => (
            <CaptainCard key={captain.id} captain={captain} refreshCaptains={getCaptains} />
          ))}
        </div>
      )}
    </div>
  );
}

export default CaptainManagementPage;
