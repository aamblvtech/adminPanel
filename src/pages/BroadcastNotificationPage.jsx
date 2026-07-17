import { useState } from "react";
import api from "../services/api";

function BroadcastNotificationPage() {
  const [form, setForm] = useState({
    audienceRole: "driver", // "driver" | "rider"
    targetGroup: "all", // "all" | "online" | "offline" | "specific"
    specificUserIds: "", // comma separated list
    title: "",
    body: "",
    screen: "Home",
    priority: "normal", // "normal" | "high"
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [sendSummary, setSendSummary] = useState(null);

  const screenOptions = {
    driver: [
      { value: "Home", label: "Home Screen (Go Online)" },
      { value: "EarningsScreen", label: "Earnings Dashboard" },
      { value: "PayoutHistory", label: "Payout History" },
      { value: "PayoutDetails", label: "Payout Details Settings" },
      { value: "MessagesScreen", label: "Notification Inbox" },
      { value: "ReferEarn", label: "Refer & Earn" },
    ],
    rider: [
      { value: "Home", label: "Home Screen (Map / Booking)" },
      { value: "Passbook", label: "Wallet / Passbook" },
      { value: "PromoCode", label: "Promo / Coupons" },
      { value: "MessagesScreen", label: "Notification Inbox" },
      { value: "ReferEarn", label: "Refer & Earn" },
    ],
  };

  const targetGroupOptions = {
    driver: [
      { value: "all", label: "All Approved Captains" },
      { value: "online", label: "Online Captains" },
      { value: "offline", label: "Offline Captains" },
      { value: "specific", label: "Specific Captain IDs" },
    ],
    rider: [
      { value: "all", label: "All Rider App Users" },
      { value: "specific", label: "Specific Rider IDs" },
    ],
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Fallback screen if audience changes
      if (name === "audienceRole") {
        updated.screen = "Home";
        updated.targetGroup = "all";
        updated.specificUserIds = "";
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setErrorMessage("Title and Body are required.");
      return;
    }
    setErrorMessage("");
    setSuccessMessage("");
    setShowConfirm(true);
  };

  const confirmSend = async () => {
    setShowConfirm(false);
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSendSummary(null);

    try {
      const payload = {
        audienceRole: form.audienceRole,
        targetGroup: form.targetGroup,
        title: form.title.trim(),
        body: form.body.trim(),
        screen: form.screen,
        priority: form.priority,
      };

      if (form.targetGroup === "specific") {
        payload.userIds = form.specificUserIds
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean);

        if (payload.userIds.length === 0) {
          throw new Error("Please specify at least one User ID for targeting.");
        }
      }

      const response = await api.post("/admin/notifications/broadcast", payload);
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setSentCount(response.data.sentCount || 0);
        setSendSummary({
          droppedCount: response.data.droppedCount || 0,
          inboxInsertedCount: response.data.inboxInsertedCount || 0,
          pushAttemptedCount: response.data.pushAttemptedCount || 0,
          pushSuccessCount: response.data.pushSuccessCount || 0,
          pushFailureCount: response.data.pushFailureCount || 0,
          pushSkipped: !!response.data.pushSkipped,
          pushError: response.data.pushError || "",
        });
        // Clear form content
        setForm((prev) => ({
          ...prev,
          title: "",
          body: "",
        }));
      } else {
        throw new Error(response.data.message || "Failed to send broadcast");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(error.response?.data?.message || error.message || "Failed to send notifications. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Marketing & Ops</p>
        <h1 className="text-3xl font-semibold text-slate-950">Broadcast Notifications</h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          Create and send instant high-priority push and inbox notifications to captains (drivers) and riders (users) in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Compose Notification</h2>
            
            {successMessage && (
              <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                <span className="font-semibold">Success!</span> {successMessage} ({sentCount} users targeted)
                {sendSummary && (
                  <div className="mt-3 grid gap-2 text-xs text-emerald-900 sm:grid-cols-2">
                    <div>Inbox rows: <span className="font-semibold">{sendSummary.inboxInsertedCount}</span></div>
                    <div>Push tokens: <span className="font-semibold">{sendSummary.pushAttemptedCount}</span></div>
                    <div>Push success: <span className="font-semibold">{sendSummary.pushSuccessCount}</span></div>
                    <div>Push failed: <span className="font-semibold">{sendSummary.pushFailureCount}</span></div>
                    {sendSummary.droppedCount > 0 && (
                      <div className="sm:col-span-2 text-amber-700">
                        Dropped audience mismatches: <span className="font-semibold">{sendSummary.droppedCount}</span>
                      </div>
                    )}
                    {sendSummary.pushSkipped && (
                      <div className="sm:col-span-2 text-amber-700">
                        Push skipped. Check Firebase configuration on the backend.
                      </div>
                    )}
                    {sendSummary.pushError && (
                      <div className="sm:col-span-2 text-amber-700">
                        Push error: <span className="font-semibold">{sendSummary.pushError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">
                <span className="font-semibold">Error:</span> {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Audience selection */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Audience App</label>
                  <select
                    name="audienceRole"
                    value={form.audienceRole}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="driver">Captain App (Drivers)</option>
                    <option value="rider">Rider App (Users)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Target Group</label>
                  <select
                    name="targetGroup"
                    value={form.targetGroup}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  >
                    {targetGroupOptions[form.audienceRole].map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {form.audienceRole === "rider" && (
                    <p className="mt-2 text-xs leading-relaxed text-slate-500">
                      Rider online status is not used for broadcasts. Target all rider app users or paste specific rider IDs.
                    </p>
                  )}
                </div>
              </div>

              {/* Specific IDs */}
              {form.targetGroup === "specific" && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    {form.audienceRole === "driver" ? "Target Captain IDs" : "Target Rider IDs"} (Comma-separated)
                  </label>
                  <textarea
                    name="specificUserIds"
                    value={form.specificUserIds}
                    onChange={handleInputChange}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000, c9a646d3-9c61-4239-ba16-654321123456"
                    rows={2}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              )}

              {/* Title & Body */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notification Title</label>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Peak hour starts now! 🚀"
                    maxLength={65}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.title.length}/65 chars</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notification Body</label>
                  <textarea
                    name="body"
                    value={form.body}
                    onChange={handleInputChange}
                    placeholder="e.g. Lots of passengers are active in your area. Go online to accept rides!"
                    rows={3}
                    maxLength={240}
                    required
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  />
                  <p className="mt-1 text-right text-xs text-slate-400">{form.body.length}/240 chars</p>
                </div>
              </div>

              {/* Redirect Action & Priority */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Redirect Screen (On Tap)</label>
                  <select
                    name="screen"
                    value={form.screen}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  >
                    {screenOptions[form.audienceRole].map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Push Priority</label>
                  <select
                    name="priority"
                    value={form.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-all"
                  >
                    <option value="normal">Normal (Default)</option>
                    <option value="high">High (High-priority alert sound)</option>
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || !form.title.trim() || !form.body.trim()}
                  className="w-full rounded-3xl bg-slate-950 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? "Sending Broadcast..." : "Send Broadcast Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Device Preview Column */}
        <div className="lg:col-span-5 flex flex-col justify-start">
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-xl relative overflow-hidden min-h-[500px] flex flex-col justify-between">
            {/* Background design */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
            
            <div className="border-b border-slate-800 pb-4">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Simulated Notification Card</span>
              <p className="text-xs text-slate-500 mt-1">Real-time preview of push banner</p>
            </div>

            {/* Simulated Phone UI */}
            <div className="my-auto flex flex-col items-center">
              <div className="w-full max-w-[340px] rounded-3xl bg-black/40 border border-slate-800/80 p-4 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-3 border-b border-slate-900 pb-3 mb-3">
                  <div className="h-6 w-6 rounded-lg overflow-hidden flex items-center justify-center shadow-inner shrink-0 text-white font-extrabold text-xs select-none">
                    {form.audienceRole === "driver" ? (
                      <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                        S
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                        S
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate text-slate-200">
                      {form.audienceRole === "driver" ? "Sancharoo Captain" : "Sancharoo Rides"}
                    </p>
                    <p className="text-[10px] text-slate-500">Just now</p>
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                    {form.priority}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-100 truncate">
                    {form.title.trim() || "Notification Title"}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed break-words">
                    {form.body.trim() || "Compose the body of your message in the editor on the left to see a preview of how it will render on driver and passenger phones."}
                  </p>
                </div>

                <div className="mt-3 border-t border-slate-900/60 pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Action: Opens {form.screen}</span>
                  <span className="text-[10px] text-slate-400 group-hover:text-white transition">Swipe up to dismiss</span>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="border-t border-slate-950 pt-4 text-center">
              <p className="text-xs text-slate-500">
                Targeting: <span className="text-slate-300 font-semibold">{form.targetGroup.toUpperCase()}</span> in{" "}
                <span className="text-slate-300 font-semibold">{form.audienceRole === "driver" ? "Captain app" : "Rider app"}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-950">Confirm Broadcast Dispatch</h3>
            <p className="mt-2 text-sm text-slate-600">
              You are about to send this push notification to all matched devices. This action is immediate and cannot be undone.
            </p>
            
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-2 text-xs text-slate-700">
              <p><span className="font-bold text-slate-950">Target Audience:</span> {form.audienceRole === "driver" ? "Captains" : "Riders"} ({form.targetGroup})</p>
              <p><span className="font-bold text-slate-950">Title:</span> {form.title}</p>
              <p><span className="font-bold text-slate-950">Body:</span> {form.body}</p>
              <p><span className="font-bold text-slate-950">Action:</span> Open {form.screen}</p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmSend}
                className="rounded-full bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-md"
              >
                Yes, Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BroadcastNotificationPage;
