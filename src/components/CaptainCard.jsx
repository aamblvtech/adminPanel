import { useState } from "react";
import api from "../services/api";

const REJECTION_OPTIONS = [
  {
    field: "selfie_url",
    label: "Selfie",
    message: "Selfie is unclear, mismatched, or missing. Upload a clear face photo.",
  },
  {
    field: "license_front_url",
    label: "Driving License Front",
    message: "Driving license front image is missing, blurred, cropped, or unreadable.",
  },
  {
    field: "license_back_url",
    label: "Driving License Back",
    message: "Driving license back image is missing, blurred, cropped, or unreadable.",
  },
  {
    field: "license_number",
    label: "Driving License Number",
    message: "Driving license number does not match the uploaded document.",
  },
  {
    field: "rc_front_url",
    label: "RC Front",
    message: "RC front image is missing, blurred, cropped, or unreadable.",
  },
  {
    field: "rc_back_url",
    label: "RC Back",
    message: "RC back image is missing, blurred, cropped, or unreadable.",
  },
  {
    field: "rc_number",
    label: "RC Number",
    message: "RC number does not match the uploaded document.",
  },
  {
    field: "aadhaar_front_url",
    label: "Aadhaar Front",
    message: "Aadhaar front image is missing, blurred, cropped, or unreadable.",
  },
  {
    field: "aadhaar_back_url",
    label: "Aadhaar Back",
    message: "Aadhaar back image is missing, blurred, cropped, or unreadable.",
  },
  {
    field: "aadhaar_number",
    label: "Aadhaar Number",
    message: "Aadhaar number does not match the uploaded document.",
  },
  {
    field: "vehicle_number",
    label: "Vehicle Number",
    message: "Vehicle number does not match the RC or is entered incorrectly.",
  },
];

function CaptainCard({ captain, refreshCaptains }) {
  const [expanded, setExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [selectedIssues, setSelectedIssues] = useState([]);
  const [customReason, setCustomReason] = useState("");
  const [nextSteps, setNextSteps] = useState(
    "Please upload clear, uncropped documents with matching numbers and submit again."
  );
  const [submittingReview, setSubmittingReview] = useState(false);

  const approveCaptain = async () => {
    if (
      captain.status === "rejected" &&
      !window.confirm("Approve this rejected captain? This will clear the rejection reason and allow them to go online after approval.")
    ) {
      return;
    }

    try {
      await api.patch(
        `/admin/captains/${captain.id}/approve`
      );

      setReviewAction(null);
      refreshCaptains();
    } catch (error) {
      console.error(error);
      alert("Failed to approve captain");
    }
  };

  const toggleIssue = (field) => {
    setSelectedIssues((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field]
    );
  };

  const openReviewForm = (action) => {
    setReviewAction((current) => (current === action ? null : action));
  };

  const submitReviewAction = async () => {
    const issues = REJECTION_OPTIONS.filter((option) =>
      selectedIssues.includes(option.field)
    );
    const reason = customReason.trim();
    const isCorrection = reviewAction === "correction";

    if (!reason && issues.length === 0) {
      alert("Select at least one problem or write a reason.");
      return;
    }

    try {
      setSubmittingReview(true);
      await api.patch(
        `/admin/captains/${captain.id}/${isCorrection ? "request-correction" : "reject"}`,
        {
          reason,
          issues,
          nextSteps: nextSteps.trim(),
        }
      );

      setReviewAction(null);
      refreshCaptains();
    } catch (error) {
      console.error(error);
      alert(isCorrection ? "Failed to request correction" : "Failed to reject captain");
    } finally {
      setSubmittingReview(false);
    }
  };

  const selectedIssueDetails = REJECTION_OPTIONS.filter((option) =>
    selectedIssues.includes(option.field)
  );
  const rejectionPreview =
    customReason.trim() ||
    selectedIssueDetails
      .map((issue) => `${issue.label}: ${issue.message}`)
      .join("; ") ||
    "Select issues or write a reason to preview the captain message.";
  const isReviewFormOpen = reviewAction !== null;
  const isCorrectionAction = reviewAction === "correction";
  const reviewTitle = isCorrectionAction
    ? "Request document correction"
    : "Tell the captain what to fix";
  const reviewSubtitle = isCorrectionAction
    ? "Captain will be moved out of approved status until they correct and resubmit."
    : "Selected items will be sent in the notification and shown on the captain app.";
  const reviewPreviewTitle = isCorrectionAction
    ? "Documents need update"
    : "Application needs changes";
  const reviewSubmitLabel = isCorrectionAction ? "Send correction request" : "Send rejection";
  const reviewSubmittingLabel = isCorrectionAction ? "Sending..." : "Rejecting...";
  const reviewBorderClass = isCorrectionAction ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50";
  const reviewTextClass = isCorrectionAction ? "text-amber-950" : "text-red-950";
  const reviewMutedTextClass = isCorrectionAction ? "text-amber-700" : "text-red-700";
  const reviewAccentTextClass = isCorrectionAction ? "text-amber-600" : "text-red-600";
  const reviewSelectedClass = isCorrectionAction
    ? "border-amber-500 bg-white text-amber-950"
    : "border-red-500 bg-white text-red-950";
  const reviewUnselectedClass = isCorrectionAction
    ? "border-amber-100 bg-amber-50/60 text-slate-700"
    : "border-red-100 bg-red-50/60 text-slate-700";
  const reviewButtonClass = isCorrectionAction ? "bg-amber-600" : "bg-red-600";
  const statusClass =
    captain.status === "approved"
      ? "bg-green-100 text-green-700"
      : captain.status === "rejected"
      ? "bg-red-100 text-red-700"
      : captain.status === "needs_correction"
      ? "bg-amber-100 text-amber-800"
      : "bg-yellow-100 text-yellow-700";
  const statusLabel =
    captain.status === "needs_correction" ? "needs correction" : captain.status;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {captain.full_name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {captain.vehicle_type} {captain.vehicle_number && `(${captain.vehicle_number})`} {captain.phone && `• ${captain.phone}`}
          </p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {expanded ? "Hide details" : "View details"}
        </button>
      </div>

      {/* STATUS */}

      <div className="mt-3">
        <span
          className={`px-3 py-1 rounded-full text-sm ${statusClass}`}
        >
          {statusLabel}
        </span>
      </div>

      {(captain.status === "rejected" || captain.status === "needs_correction") && captain.rejection_reason && (
        <div className={`mt-4 rounded-2xl border p-4 ${
          captain.status === "needs_correction"
            ? "border-amber-200 bg-amber-50"
            : "border-red-200 bg-red-50"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-[0.16em] ${
            captain.status === "needs_correction" ? "text-amber-600" : "text-red-500"
          }`}>
            {captain.status === "needs_correction" ? "Correction requested" : "Last rejection reason"}
          </p>
          <p className={`mt-2 text-sm font-semibold ${
            captain.status === "needs_correction" ? "text-amber-950" : "text-red-900"
          }`}>
            {captain.rejection_reason}
          </p>
        </div>
      )}

      {/* DETAILS */}

      {expanded && (
        <div className="mt-5 border-t pt-5">

          <div className="grid md:grid-cols-2 gap-4">

            <Info
              label="Vehicle Number"
              value={captain.vehicle_number}
            />

            <Info
              label="License Number"
              value={captain.license_number}
            />

            <Info
              label="Aadhaar Number"
              value={captain.aadhaar_number}
            />

            <Info
              label="RC Number"
              value={captain.rc_number}
            />

            <Info
              label="Payout Method"
              value={captain.payout_method ? captain.payout_method.toUpperCase() : "Missing"}
            />

            {captain.payout_method === "upi" ? (
              <>
                <Info
                  label="UPI ID"
                  value={captain.upi_id}
                />
                {captain.upi_qr_url && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">UPI QR</p>
                    <img
                      src={captain.upi_qr_url}
                      alt="Captain UPI QR"
                      className="h-32 w-32 rounded-lg border border-slate-200 bg-white object-contain"
                    />
                  </div>
                )}
              </>
            ) : captain.payout_method === "bank" ? (
              <>
                <Info
                  label="Account Holder"
                  value={captain.account_holder_name}
                />
                <Info
                  label="Account Number"
                  value={captain.account_number}
                />
                <Info
                  label="IFSC"
                  value={captain.ifsc}
                />
              </>
            ) : null}
          </div>

          {/* IMAGES */}

          <div className="mt-6 grid md:grid-cols-2 gap-4">

              <ImageCard
              title="Selfie"
              url={captain.selfie_url}
              onOpen={setPreviewImage}
            />

            <ImageCard
              title="License Front"
              url={captain.license_front_url}
              onOpen={setPreviewImage}
            />

            <ImageCard
              title="License Back"
              url={captain.license_back_url}
              onOpen={setPreviewImage}
            />

            <ImageCard
              title="RC Front"
              url={captain.rc_front_url}
              onOpen={setPreviewImage}
            />

            <ImageCard
              title="RC Back"
              url={captain.rc_back_url}
              onOpen={setPreviewImage}
            />

            <ImageCard
              title="Aadhaar Front"
              url={captain.aadhaar_front_url}
              onOpen={setPreviewImage}
            />

            <ImageCard
              title="Aadhaar Back"
              url={captain.aadhaar_back_url}
              onOpen={setPreviewImage}
            />
          </div>

          {/* ACTIONS */}

          {captain.status ===
            "pending" && (
            <div className="flex gap-3 mt-6">

              <button
                onClick={approveCaptain}
                className="bg-green-600 text-white px-5 py-2 rounded"
              >
                Approve
              </button>

              <button
                onClick={() => openReviewForm("reject")}
                className="bg-red-600 text-white px-5 py-2 rounded"
              >
                Reject
              </button>

            </div>
          )}

          {captain.status === "approved" && (
            <div className="mt-6">
              <button
                onClick={() => openReviewForm("correction")}
                className="bg-amber-600 text-white px-5 py-2 rounded"
              >
                Request correction
              </button>
            </div>
          )}

          {captain.status === "rejected" && (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-bold text-emerald-950">
                Rejected by mistake?
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-700">
                Approving will clear the rejection reason and notify the captain that they are approved.
              </p>
              <button
                onClick={approveCaptain}
                className="mt-3 rounded bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Approve anyway
              </button>
            </div>
          )}

          {(captain.status === "pending" || captain.status === "approved") && isReviewFormOpen && (
            <div className={`mt-5 rounded-2xl border p-4 ${reviewBorderClass}`}>
              <div className="flex flex-col gap-1">
                <p className={`text-sm font-bold ${reviewTextClass}`}>{reviewTitle}</p>
                <p className={`text-xs font-semibold ${reviewMutedTextClass}`}>
                  {reviewSubtitle}
                </p>
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {REJECTION_OPTIONS.map((option) => (
                  <label
                    key={option.field}
                    className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm font-semibold transition ${
                      selectedIssues.includes(option.field)
                        ? reviewSelectedClass
                        : reviewUnselectedClass
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIssues.includes(option.field)}
                      onChange={() => toggleIssue(option.field)}
                      className="mt-1"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              <label className="mt-4 block">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${reviewAccentTextClass}`}>
                  Extra reason
                </span>
                <textarea
                  value={customReason}
                  onChange={(event) => setCustomReason(event.target.value)}
                  rows={3}
                  placeholder="Example: Aadhaar front is cut off and the vehicle number differs from RC."
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </label>

              <label className="mt-4 block">
                <span className={`text-xs font-bold uppercase tracking-[0.14em] ${reviewAccentTextClass}`}>
                  What captain should do
                </span>
                <textarea
                  value={nextSteps}
                  onChange={(event) => setNextSteps(event.target.value)}
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-slate-900"
                />
              </label>

              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <p className={`text-xs font-bold uppercase tracking-[0.14em] ${reviewAccentTextClass}`}>
                  Captain will see
                </p>
                <p className="mt-2 text-sm font-bold text-slate-950">
                  {reviewPreviewTitle}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {rejectionPreview}
                </p>
                {selectedIssueDetails.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedIssueDetails.map((issue) => (
                      <span
                        key={issue.field}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isCorrectionAction
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {issue.label}
                      </span>
                    ))}
                  </div>
                )}
                {nextSteps.trim() && (
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Next step: {nextSteps.trim()}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submitReviewAction}
                  disabled={submittingReview}
                  className={`rounded px-5 py-2 text-sm font-bold text-white disabled:opacity-60 ${reviewButtonClass}`}
                >
                  {submittingReview ? reviewSubmittingLabel : reviewSubmitLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction(null)}
                  className="rounded border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white"
              aria-label="Close image preview"
            >
              ×
            </button>
            <img
              src={previewImage}
              alt="Captain preview"
              className="h-auto max-h-[85vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value || "-"}</p>
    </div>
  );
}

function ImageCard({ title, url, onOpen }) {
  if (!url) return null;

  return (
    <button
      type="button"
      onClick={() => onOpen(url)}
      className="group text-left rounded-3xl border border-slate-200 bg-white p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400"
    >
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-slate-100">
        <img
          src={url}
          alt={title}
          className="h-20 w-full object-contain transition duration-300 ease-out group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </div>
      <p className="mt-2 text-xs text-slate-500">Hover to zoom — click to enlarge</p>
    </button>
  );
}

export default CaptainCard;
