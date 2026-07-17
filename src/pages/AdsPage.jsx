import { useEffect, useMemo, useRef, useState } from "react";
import api from "../services/api";

const PLACEMENT_OPTIONS = [
  { value: "HOME_BOTTOM_SHEET", label: "Home bottom sheet" },
  { value: "REWARDS_TOP", label: "Rewards top" },
  { value: "REFER_EARN_TOP", label: "Refer & Earn top" },
];

const PRIORITY_OPTIONS = [
  { value: "0", label: "Normal" },
  { value: "10", label: "High" },
  { value: "-10", label: "Low" },
];

const initialForm = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  placements: ["HOME_BOTTOM_SHEET"],
  priority: "0",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

const CROP_WIDTH = 1200;
const CROP_HEIGHT = 360;
const AD_IMAGE_UPLOAD_PATH = "/admin/ads/upload-image";

const toLocalInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const toIsoOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const getStatus = (ad) => {
  if (!ad.is_active) return { label: "Paused", className: "bg-slate-100 text-slate-600" };
  const now = new Date();
  if (ad.starts_at && new Date(ad.starts_at) > now) {
    return { label: "Scheduled", className: "bg-blue-50 text-blue-700" };
  }
  if (ad.ends_at && new Date(ad.ends_at) < now) {
    return { label: "Expired", className: "bg-rose-50 text-rose-700" };
  }
  return { label: "Live", className: "bg-emerald-50 text-emerald-700" };
};

const getCtr = (ad) => {
  const impressions = Number(ad.impression_count || 0);
  const clicks = Number(ad.click_count || 0);
  if (!impressions) return "0.0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
};

function AdsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [pendingBanner, setPendingBanner] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [searchQuery, setSearchQuery] = useState("");
  const cropCanvasRef = useRef(null);
  const cropDialogRef = useRef(null);
  const cropTriggerRef = useRef(null);

  const loadAds = async () => {
    try {
      const response = await api.get("/admin/ads");
      setAds(response.data.ads || []);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to load ad campaigns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const togglePlacement = (placement) => {
    setForm((prev) => {
      const current = prev.placements || [];
      const exists = current.includes(placement);
      const nextPlacements = exists
        ? current.filter((item) => item !== placement)
        : [...current, placement];

      return {
        ...prev,
        placements: nextPlacements,
      };
    });
  };

  const drawCropPreview = () => {
    const canvas = cropCanvasRef.current;
    const source = cropImage?.image;
    if (!canvas || !source) return;

    canvas.width = CROP_WIDTH;
    canvas.height = CROP_HEIGHT;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, CROP_WIDTH, CROP_HEIGHT);
    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(0, 0, CROP_WIDTH, CROP_HEIGHT);

    const baseScale = Math.max(
      CROP_WIDTH / source.naturalWidth,
      CROP_HEIGHT / source.naturalHeight,
    );
    const scale = baseScale * cropZoom;
    const drawWidth = source.naturalWidth * scale;
    const drawHeight = source.naturalHeight * scale;
    const maxOffsetX = Math.max(0, (drawWidth - CROP_WIDTH) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - CROP_HEIGHT) / 2);
    const offsetXPx = (cropOffsetX / 100) * maxOffsetX;
    const offsetYPx = (cropOffsetY / 100) * maxOffsetY;
    const drawX = (CROP_WIDTH - drawWidth) / 2 + offsetXPx;
    const drawY = (CROP_HEIGHT - drawHeight) / 2 + offsetYPx;

    ctx.drawImage(source, drawX, drawY, drawWidth, drawHeight);
  };

  useEffect(() => {
    drawCropPreview();
  }, [cropImage, cropZoom, cropOffsetX, cropOffsetY]);

  useEffect(() => {
    if (!cropImage) return undefined;

    cropDialogRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeCropModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [cropImage]);

  useEffect(() => {
    return () => {
      if (cropImage?.previewUrl) {
        URL.revokeObjectURL(cropImage.previewUrl);
      }
    };
  }, [cropImage?.previewUrl]);

  useEffect(() => {
    return () => {
      if (pendingBanner?.previewUrl) {
        URL.revokeObjectURL(pendingBanner.previewUrl);
      }
    };
  }, [pendingBanner?.previewUrl]);

  const clearPendingBanner = () => {
    setPendingBanner((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
  };

  const closeCropModal = () => {
    setCropImage((current) => {
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    cropTriggerRef.current?.focus();
  };

  const handleImageSelect = async (event) => {
    cropTriggerRef.current = event.currentTarget;
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a JPG, PNG, or WebP image.");
      return;
    }

    const maxBytes = 10 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("Image is too large. Please upload a file smaller than 10 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (cropImage?.previewUrl) {
        URL.revokeObjectURL(cropImage.previewUrl);
      }
      setCropImage({
        file,
        previewUrl,
        image,
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
      setCropZoom(1);
      setCropOffsetX(0);
      setCropOffsetY(0);
    };
    image.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      alert("Could not read this image. Please try a different file.");
    };
    image.src = previewUrl;
  };

  const useCroppedImage = async () => {
    const canvas = cropCanvasRef.current;
    if (!canvas || !cropImage) return;

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/webp", 0.92);
    });

    if (!blob) {
      alert("Could not crop this image. Please try again.");
      return;
    }

    const previewUrl = URL.createObjectURL(blob);
    const safeName = cropImage.file.name.replace(/\.[^.]+$/, "") || "ad-banner";
    clearPendingBanner();
    setPendingBanner({
      blob,
      previewUrl,
      fileName: `${safeName}-1200x360.webp`,
    });
    closeCropModal();
  };

  const uploadPendingBanner = async () => {
    if (!pendingBanner?.blob) {
      return form.imageUrl.trim();
    }

    const createUploadFormData = () => {
      const formData = new FormData();
      formData.append("image", pendingBanner.blob, pendingBanner.fileName);
      return formData;
    };

    const uploadConfig = {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    };

    const response = await api.post(AD_IMAGE_UPLOAD_PATH, createUploadFormData(), uploadConfig);

    const imageUrl = response.data?.imageUrl || response.data?.url;
    if (!imageUrl) {
      throw new Error("Upload did not return an image URL.");
    }

    return imageUrl;
  };

  const buildPayload = (imageUrl) => ({
    title: form.title.trim(),
    image_url: imageUrl,
    link_url: form.linkUrl.trim(),
    placements: form.placements,
    priority: Number(form.priority),
    starts_at: toIsoOrNull(form.startsAt),
    ends_at: toIsoOrNull(form.endsAt),
    is_active: form.isActive,
    per_user_daily_cap: 3,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      alert("Please add an internal ad name.");
      return;
    }
    if (!pendingBanner && !form.imageUrl.trim()) {
      alert("Please select and crop an image.");
      return;
    }
    if (!form.linkUrl.trim()) {
      alert("Please add a destination link.");
      return;
    }
    if (!form.placements?.length) {
      alert("Please select at least one screen.");
      return;
    }

    let uploadedImageUrl = null;

    try {
      setSaving(true);
      setUploadingImage(Boolean(pendingBanner));
      const imageUrl = await uploadPendingBanner();
      if (pendingBanner) {
        uploadedImageUrl = imageUrl;
      }
      if (editingId) {
        await api.patch(`/admin/ads/${editingId}`, buildPayload(imageUrl));
      } else {
        await api.post("/admin/ads", buildPayload(imageUrl));
      }
      clearPendingBanner();
      setForm(initialForm);
      setEditingId(null);
      await loadAds();
      alert(editingId ? "Ad updated." : "Ad created.");
    } catch (error) {
      console.error(error);
      if (uploadedImageUrl) {
        updateForm("imageUrl", uploadedImageUrl);
        clearPendingBanner();
      }
      const status = error.response?.status;
      const baseUrl = api.defaults.baseURL || window.location.origin;
      const requestUrl = `${String(baseUrl).replace(/\/$/, "")}${AD_IMAGE_UPLOAD_PATH}`;
      const message = error.response?.data?.message
        || (status === 404
          ? `Upload endpoint was not found: ${requestUrl}. Please restart/deploy the backend with the latest upload routes.`
          : error.message)
        || "Failed to save ad.";
      alert(message);
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      await api.patch(`/admin/ads/${ad.id}`, { is_active: !ad.is_active });
      await loadAds();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to update ad.");
    }
  };

  const handleDelete = async (ad) => {
    if (!window.confirm(`Delete "${ad.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/admin/ads/${ad.id}`);
      await loadAds();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to delete ad.");
    }
  };

  const startEdit = (ad) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title || "",
      imageUrl: ad.image_url || "",
      linkUrl: ad.link_url || ad.cta_value || "",
      placements: ad.placements?.length ? ad.placements : ["HOME_BOTTOM_SHEET"],
      priority: String(ad.priority ?? 0),
      startsAt: toLocalInputValue(ad.starts_at),
      endsAt: toLocalInputValue(ad.ends_at),
      isActive: ad.is_active,
    });
    clearPendingBanner();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredAds = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return ads;
    return ads.filter((ad) => {
      return (
        ad.title?.toLowerCase().includes(query) ||
        ad.placements?.join(" ").toLowerCase().includes(query)
      );
    });
  }, [ads, searchQuery]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Local Ads</p>
          <h1 className="text-3xl font-semibold text-slate-950">Image banner ads</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Create simple in-app sponsored banners. Each ad is one image, one destination link, and one or more screens.
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {editingId ? "Edit ad" : "Create ad"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recommended image ratio: 10:3, for example 1200 x 360.
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(initialForm);
                  closeCropModal();
                  clearPendingBanner();
                }}
                className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Internal name</label>
              <input
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Weekend restaurant banner"
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Image</label>
              <div className="mt-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  disabled={saving}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-3xl file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Select an image and crop it to 10:3. The cropped banner uploads only when you save the ad.
                </p>
              </div>
              {uploadingImage ? (
                <p className="mt-2 text-sm font-semibold text-slate-500">Uploading image while saving ad...</p>
              ) : null}
              {pendingBanner || form.imageUrl ? (
                <div className="mt-4">
                  <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
                    <img
                      src={pendingBanner?.previewUrl || form.imageUrl}
                      alt=""
                      className="aspect-[10/3] w-full object-cover"
                    />
                  </div>
                  {pendingBanner ? (
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-emerald-700">
                        Cropped banner ready. It will upload when you save the ad.
                      </p>
                      <button
                        type="button"
                        onClick={clearPendingBanner}
                        className="rounded-3xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Remove crop
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {form.imageUrl && !pendingBanner ? (
                <p className="mt-2 break-all text-xs font-medium text-slate-500">
                  Current uploaded URL: {form.imageUrl}
                </p>
              ) : null}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Destination link</label>
              <input
                value={form.linkUrl}
                onChange={(event) => updateForm("linkUrl", event.target.value)}
                placeholder="https://example.com/offer"
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-slate-700">Screens</p>
                <div className="mt-2 grid gap-2">
                  {PLACEMENT_OPTIONS.map((option) => {
                    const checked = form.placements?.includes(option.value);
                    return (
                      <label
                        key={option.value}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                          checked
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlacement(option.value)}
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Priority</label>
                <select
                  value={form.priority}
                  onChange={(event) => updateForm("priority", event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Starts at</label>
                <input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(event) => updateForm("startsAt", event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Ends at</label>
                <input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(event) => updateForm("endsAt", event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => updateForm("isActive", event.target.checked)}
              />
              Active
            </label>

            <button
              type="submit"
              disabled={saving || uploadingImage}
              className="w-full rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {uploadingImage ? "Uploading image..." : saving ? "Saving..." : editingId ? "Save ad" : "Create ad"}
            </button>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Ads</h2>
              <p className="mt-1 text-sm text-slate-500">Monitor live status, impressions, clicks, and CTR.</p>
            </div>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search ads"
              className="rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-slate-500">Loading ads...</p>
            ) : filteredAds.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No ads found.
              </p>
            ) : (
              filteredAds.map((ad) => {
                const status = getStatus(ad);
                const testLink = ad.link_url || ad.cta_value || "";
                const canTestLink = /^https:\/\//i.test(testLink);
                return (
                  <article key={ad.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt="" className="aspect-[10/3] w-full object-cover" />
                      ) : (
                        <div className="flex aspect-[10/3] items-center justify-center text-sm font-semibold text-slate-400">
                          No image
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">{ad.title}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.className}`}>
                            {status.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {(ad.placements || []).join(", ")} - Priority {ad.priority}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">Impressions</p>
                        <p className="mt-1 text-xl font-semibold text-slate-950">{ad.impression_count}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">Clicks</p>
                        <p className="mt-1 text-xl font-semibold text-slate-950">{ad.click_count}</p>
                      </div>
                      <div className="rounded-2xl bg-white p-3">
                        <p className="text-xs font-bold uppercase text-slate-400">CTR</p>
                        <p className="mt-1 text-xl font-semibold text-slate-950">{getCtr(ad)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(ad)}
                        className="rounded-3xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {ad.is_active ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(ad)}
                        className="rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(testLink, "_blank", "noopener,noreferrer")}
                        disabled={!canTestLink}
                        className="rounded-3xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Test link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(ad)}
                        className="rounded-3xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </div>

      {cropImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div
            ref={cropDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-dialog-title"
            tabIndex={-1}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl outline-none"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 id="crop-dialog-title" className="text-xl font-semibold text-slate-950">
                  Crop banner
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Source: {cropImage.width} x {cropImage.height}. Output: 1200 x 360.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-3xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-100">
              <canvas ref={cropCanvasRef} className="aspect-[10/3] w-full" />
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm font-medium text-slate-700">
                Zoom
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.01"
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Horizontal position
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropOffsetX}
                  onChange={(event) => setCropOffsetX(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>

              <label className="text-sm font-medium text-slate-700">
                Vertical position
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropOffsetY}
                  onChange={(event) => setCropOffsetY(Number(event.target.value))}
                  className="mt-2 w-full"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeCropModal}
                className="rounded-3xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={useCroppedImage}
                className="rounded-3xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Use crop
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdsPage;
