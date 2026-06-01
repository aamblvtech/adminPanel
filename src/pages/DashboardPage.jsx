import { useEffect, useState } from "react";
import api from "../services/api";
import CaptainCard from "../components/CaptainCard";

function DashboardPage() {
  const [captains, setCaptains] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const getCaptains = async () => {
    try {
      const response =
        await api.get(
          "/admin/captains"
        );

      setCaptains(
        response.data.captains
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCaptains();
  }, []);

  if (loading) {
    return (
      <div className="p-10">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="max-w-7xl mx-auto p-6">

        <h1 className="text-3xl font-bold mb-8">
          Captain Verification
        </h1>

        <div className="space-y-5">
          {captains.map(
            (captain) => (
              <CaptainCard
                key={captain.id}
                captain={captain}
                refreshCaptains={
                  getCaptains
                }
              />
            )
          )}
        </div>

      </div>
    </div>
  );
}

export default DashboardPage;