import { useState } from "react";
import api from "../services/api";

function CaptainCard({ captain, refreshCaptains }) {
  const [expanded, setExpanded] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const approveCaptain = async () => {
    try {
      await api.patch(
        `/admin/captains/${captain.id}/approve`
      );

      refreshCaptains();
    } catch (error) {
      console.error(error);
      alert("Failed to approve captain");
    }
  };

  const rejectCaptain = async () => {
    const reason = prompt(
      "Enter rejection reason"
    );

    if (!reason) return;

    try {
      await api.patch(
        `/admin/captains/${captain.id}/reject`,
        { reason }
      );

      refreshCaptains();
    } catch (error) {
      console.error(error);
      alert("Failed to reject captain");
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* HEADER */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {captain.full_name}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {captain.vehicle_type}
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
          className={`px-3 py-1 rounded-full text-sm ${
            captain.status === "approved"
              ? "bg-green-100 text-green-700"
              : captain.status === "rejected"
              ? "bg-red-100 text-red-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {captain.status}
        </span>
      </div>

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
                onClick={rejectCaptain}
                className="bg-red-600 text-white px-5 py-2 rounded"
              >
                Reject
              </button>

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
          className="h-20 w-full object-cover transition duration-300 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
      </div>
      <p className="mt-2 text-xs text-slate-500">Hover to zoom — click to enlarge</p>
    </button>
  );
}

export default CaptainCard;