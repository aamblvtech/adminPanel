import { useEffect, useState } from "react";
import api from "../services/api";

function ReferralPage() {
  const [activeTab, setActiveTab] = useState("p2p"); // "p2p" | "campaigns" | "usages"

  // P2P Referral states
  const [referrals, setReferrals] = useState([]);
  const [loadingP2P, setLoadingP2P] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRevoking, setIsRevoking] = useState(null);

  // Custom campaign states
  const [customCampaigns, setCustomCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [campaignForm, setCampaignForm] = useState({
    code: "",
    coinsReward: "",
    description: "",
    usageLimit: "",
    instantReward: false,
    targetRole: "both",
    startsAt: "",
    expiresAt: "",
  });

  // Usages states
  const [usages, setUsages] = useState([]);
  const [loadingUsages, setLoadingUsages] = useState(true);
  const [searchQueryUsages, setSearchQueryUsages] = useState("");

  const loadReferrals = async () => {
    try {
      setLoadingP2P(true);
      const response = await api.get("/admin/referrals");
      setReferrals(response.data.referrals || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load user referrals");
    } finally {
      setLoadingP2P(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      const response = await api.get("/admin/custom-referrals");
      setCustomCampaigns(response.data.customReferrals || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load custom campaigns");
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadUsages = async () => {
    try {
      setLoadingUsages(true);
      const response = await api.get("/admin/custom-referrals/usages");
      setUsages(response.data.usages || []);
    } catch (error) {
      console.error(error);
      alert("Failed to load campaign usage logs");
    } finally {
      setLoadingUsages(false);
    }
  };

  useEffect(() => {
    loadReferrals();
    loadCampaigns();
    loadUsages();
  }, []);

  const handleRevoke = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this referral relationship? This will clear the link and allow the referee to apply another code."
      )
    ) {
      return;
    }

    try {
      setIsRevoking(id);
      const response = await api.delete(`/admin/referrals/${id}`);
      alert(response.data.message || "Referral relationship revoked successfully.");
      loadReferrals();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to revoke referral relationship.");
    } finally {
      setIsRevoking(null);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();

    if (!campaignForm.code.trim() || !campaignForm.coinsReward.trim()) {
      alert("Please provide a code name and coin reward value.");
      return;
    }

    try {
      await api.post("/admin/custom-referrals", {
        code: campaignForm.code.trim().toUpperCase(),
        coins_reward: parseFloat(campaignForm.coinsReward),
        description: campaignForm.description.trim() || null,
        usage_limit: campaignForm.usageLimit ? parseInt(campaignForm.usageLimit, 10) : null,
        instant_reward: campaignForm.instantReward,
        target_role: campaignForm.targetRole,
        starts_at: campaignForm.startsAt || null,
        expires_at: campaignForm.expiresAt || null,
      });

      setCampaignForm({
        code: "",
        coinsReward: "",
        description: "",
        usageLimit: "",
        instantReward: false,
        targetRole: "both",
        startsAt: "",
        expiresAt: "",
      });

      alert("Custom campaign created successfully.");
      loadCampaigns();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create campaign.");
    }
  };

  const handleToggleCampaign = async (id, currentActive) => {
    try {
      await api.patch(`/admin/custom-referrals/${id}/toggle`, {
        is_active: !currentActive,
      });
      loadCampaigns();
    } catch (error) {
      console.error(error);
      alert("Failed to toggle campaign status.");
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm("Are you sure you want to delete this custom referral campaign?")) {
      return;
    }

    try {
      await api.delete(`/admin/custom-referrals/${id}`);
      alert("Campaign deleted successfully.");
      loadCampaigns();
    } catch (error) {
      console.error(error);
      alert("Failed to delete campaign.");
    }
  };

  // Search filter P2P
  const filteredReferrals = referrals.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.referrer_name?.toLowerCase().includes(q) ||
      item.referrer_phone?.toLowerCase().includes(q) ||
      item.referee_name?.toLowerCase().includes(q) ||
      item.referee_phone?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  // Search filter Usages
  const filteredUsages = usages.filter((item) => {
    const q = searchQueryUsages.toLowerCase().trim();
    if (!q) return true;
    return (
      item.user_name?.toLowerCase().includes(q) ||
      item.user_phone?.toLowerCase().includes(q) ||
      item.campaign_code?.toLowerCase().includes(q) ||
      item.status?.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalInvites = referrals.length;
  const successfulReferrals = referrals.filter((r) => r.status === "rewarded").length;
  const totalP2PCoinsRewarded = referrals.reduce(
    (sum, r) =>
      sum +
      (r.status === "rewarded"
        ? parseFloat(r.referrer_coins_reward || 0) + parseFloat(r.referee_coins_reward || 0)
        : 0),
    0
  );

  const totalCampaignUsages = usages.length;
  const rewardedCampaignUsages = usages.filter((u) => u.status === "rewarded").length;
  const totalCampaignCoinsRewarded = usages.reduce(
    (sum, u) => sum + (u.status === "rewarded" ? parseFloat(u.coins_reward || 0) : 0),
    0
  );

  const getCampaignStatusLabel = (c) => {
    if (!c.is_active) {
      return { text: "Disabled", className: "bg-slate-200 text-slate-700" };
    }
    const now = new Date();
    if (c.starts_at && now < new Date(c.starts_at)) {
      return { text: "Scheduled", className: "bg-blue-100 text-blue-700" };
    }
    if (c.expires_at && now > new Date(c.expires_at)) {
      return { text: "Expired", className: "bg-red-100 text-red-700" };
    }
    return { text: "Active", className: "bg-emerald-100 text-emerald-700" };
  };

  return (
    <div>
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Referrals & Campaigns</p>
          <h1 className="text-3xl font-semibold text-slate-950">Referral Management</h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            Monitor peer-to-peer (P2P) user invites, create custom campaign codes, and view promotional logs.
          </p>
        </div>
      </div>

      {/* TABS SELECTOR */}
      <div className="mb-8 flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("p2p")}
          className={`px-5 py-3 text-sm font-semibold rounded-t-3xl border-t border-x -mb-px transition ${
            activeTab === "p2p"
              ? "bg-white border-slate-200 text-slate-950"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          P2P Invites ({totalInvites})
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`px-5 py-3 text-sm font-semibold rounded-t-3xl border-t border-x -mb-px transition ${
            activeTab === "campaigns"
              ? "bg-white border-slate-200 text-slate-955"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          Custom Campaigns ({customCampaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("usages")}
          className={`px-5 py-3 text-sm font-semibold rounded-t-3xl border-t border-x -mb-px transition ${
            activeTab === "usages"
              ? "bg-white border-slate-200 text-slate-950"
              : "bg-transparent border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          Campaign Usages ({totalCampaignUsages})
        </button>
      </div>

      {/* STATS CARDS BY ACTIVE TAB */}
      {activeTab === "p2p" && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total P2P Invites</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totalInvites}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Successful (Rewarded)</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{successfulReferrals}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Links</p>
            <p className="mt-2 text-3xl font-semibold text-amber-500">{totalInvites - successfulReferrals}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Coins Distributed</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totalP2PCoinsRewarded} S-Coins</p>
          </div>
        </div>
      )}

      {activeTab !== "p2p" && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Campaigns</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {customCampaigns.filter((c) => getCampaignStatusLabel(c).text === "Active").length}
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Campaign Claims</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totalCampaignUsages}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Rewarded Claims</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{rewardedCampaignUsages}</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Campaign Coins Paid</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">{totalCampaignCoinsRewarded} S-Coins</p>
          </div>
        </div>
      )}

      {/* TAB CONTENT: P2P */}
      {activeTab === "p2p" && (
        <div>
          {/* SEARCH / FILTERS */}
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Search by Referrer or Referee name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          {/* REFERRALS LIST */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">User Referral Relationships</h2>
              <p className="text-sm text-slate-500">
                {loadingP2P ? "Loading..." : `${filteredReferrals.length} record${filteredReferrals.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {loadingP2P ? (
              <div className="py-8 text-center text-slate-600">Loading referral records...</div>
            ) : filteredReferrals.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
                No referral records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Referrer (Friend)</th>
                      <th className="py-3 px-4">Referee (New User)</th>
                      <th className="py-3 px-4">Linked Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Referrer Reward</th>
                      <th className="py-3 px-4">Referee Reward</th>
                      <th className="py-3 px-4">Completed Ride ID</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReferrals.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-4 px-4 font-medium text-slate-900">
                          <div>{item.referrer_name || "User"}</div>
                          <div className="text-xs text-slate-400">{item.referrer_phone || "—"}</div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-900">
                          <div>{item.referee_name || "User"}</div>
                          <div className="text-xs text-slate-400">{item.referee_phone || "—"}</div>
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500">
                          {item.created_at ? new Date(item.created_at).toLocaleString() : "—"}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.status === "rewarded"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status === "rewarded" ? "Rewarded" : "Pending"}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-950">
                          {item.status === "rewarded" ? `+${item.referrer_coins_reward} S-Coins` : "—"}
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-950">
                          {item.status === "rewarded" ? `+${item.referee_coins_reward} S-Coins` : "—"}
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-500">
                          {item.completed_ride_id ? `${item.completed_ride_id.slice(0, 8)}...` : "—"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleRevoke(item.id)}
                            disabled={isRevoking !== null}
                            className={`rounded-3xl border border-red-200 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50`}
                          >
                            {isRevoking === item.id ? "Revoking..." : "Revoke Link"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB CONTENT: CUSTOM CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
          {/* CREATE CAMPAIGN FORM */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
            <h2 className="text-xl font-semibold text-slate-900">Create Campaign Code</h2>
            <form onSubmit={handleCreateCampaign} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Code Name</label>
                <input
                  type="text"
                  placeholder="e.g. WELCOME100"
                  value={campaignForm.code}
                  onChange={(e) => setCampaignForm((prev) => ({ ...prev, code: e.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">S-Coins Reward</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={campaignForm.coinsReward}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, coinsReward: e.target.value }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Max Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Optional (unlimited)"
                    value={campaignForm.usageLimit}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, usageLimit: e.target.value }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Start Date</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.startsAt}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, startsAt: e.target.value }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Expiry Date</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.expiresAt}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, expiresAt: e.target.value }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">Target User Role</label>
                  <select
                    value={campaignForm.targetRole}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, targetRole: e.target.value }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                  >
                    <option value="both">Both (Riders & Captains)</option>
                    <option value="rider">Riders Only</option>
                    <option value="driver">Captains/Drivers Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">Campaign Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Marketing campaign for students"
                    value={campaignForm.description}
                    onChange={(e) =>
                      setCampaignForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="instantReward"
                  checked={campaignForm.instantReward}
                  onChange={(e) =>
                    setCampaignForm((prev) => ({ ...prev, instantReward: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-950"
                />
                <label htmlFor="instantReward" className="text-sm font-medium text-slate-700 select-none">
                  Instant reward upon code apply (without ride completion)
                </label>
              </div>

              <button
                type="submit"
                className="w-full inline-flex justify-center rounded-3xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Launch Campaign
              </button>
            </form>
          </section>

          {/* CAMPAIGNS LIST */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Campaign Codes</h2>

            {loadingCampaigns ? (
              <div className="py-8 text-center text-slate-600">Loading custom campaigns...</div>
            ) : customCampaigns.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
                No custom campaign codes created yet.
              </div>
            ) : (
              <div className="space-y-4">
                {customCampaigns.map((c) => {
                  const status = getCampaignStatusLabel(c);
                  return (
                    <div key={c.id} className="rounded-3xl border border-slate-200 bg-slate-50/50 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base font-bold tracking-wide text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-2xl">
                            {c.code}
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                            {status.text}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleCampaign(c.id, c.is_active)}
                            className="rounded-full bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition"
                          >
                            Toggle Status
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(c.id)}
                            className="text-xs font-semibold text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p className="mt-3 text-sm text-slate-600">{c.description || "No description provided."}</p>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 text-xs text-slate-500 border-t border-slate-200/60 pt-3">
                        <div className="space-y-1">
                          <p>
                            <span className="font-semibold text-slate-700">Reward:</span> {c.coins_reward} S-Coins
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Payout Trigger:</span>{" "}
                            {c.instant_reward ? "Instant Credit" : "First Ride Completed"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Target Role:</span>{" "}
                            <span className="capitalize">{c.target_role === "both" ? "All Users" : c.target_role}</span>
                          </p>
                        </div>
                        <div className="space-y-1 sm:border-l sm:border-slate-200/60 sm:pl-4">
                          <p>
                            <span className="font-semibold text-slate-700">Usage Limit:</span> {c.used_count} /{" "}
                            {c.usage_limit ?? "∞"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Starts:</span>{" "}
                            {c.starts_at ? new Date(c.starts_at).toLocaleString() : "Immediate"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-700">Expires:</span>{" "}
                            {c.expires_at ? new Date(c.expires_at).toLocaleString() : "Never"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB CONTENT: USAGES */}
      {activeTab === "usages" && (
        <div>
          {/* SEARCH FILTERS */}
          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <input
              type="text"
              placeholder="Search by user name, phone, code or status..."
              value={searchQueryUsages}
              onChange={(e) => setSearchQueryUsages(e.target.value)}
              className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          {/* USAGES TABLE */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">Campaign Claims Logs</h2>
              <p className="text-sm text-slate-500">
                {loadingUsages ? "Loading..." : `${filteredUsages.length} claim${filteredUsages.length === 1 ? "" : "s"}`}
              </p>
            </div>

            {loadingUsages ? (
              <div className="py-8 text-center text-slate-600">Loading usage records...</div>
            ) : filteredUsages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 py-12 text-center text-slate-500">
                No custom campaign code usages recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Referee User</th>
                      <th className="py-3 px-4">Campaign Code</th>
                      <th className="py-3 px-4">Coins Reward</th>
                      <th className="py-3 px-4">Apply Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Completed Ride ID</th>
                      <th className="py-3 px-4">Rewarded Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsages.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-4 px-4 font-medium text-slate-900">
                          <div>{item.user_name || "User"}</div>
                          <div className="text-xs text-slate-400">{item.user_phone || "—"}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {item.campaign_code}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-950">+{item.coins_reward} S-Coins</td>
                        <td className="py-4 px-4 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.status === "rewarded"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {item.status === "rewarded" ? "Rewarded" : "Pending First Ride"}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs text-slate-500">
                          {item.completed_ride_id ? `${item.completed_ride_id.slice(0, 8)}...` : "—"}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500">
                          {item.rewarded_at ? new Date(item.rewarded_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default ReferralPage;
