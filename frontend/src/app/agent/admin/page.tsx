"use client";
/**
 * src/app/agent/admin/page.tsx
 *
 * Full property management admin panel.
 * Connects to your Django REST API for all CRUD operations.
 * Accessible only to authenticated agents/admins (protected by agent layout).
 */

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { api } from "@/lib/api-client";
import type { Property, PropertyCard, PaginatedResponse, Inquiry } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────

interface PropertyFormData {
  title: string;
  description: string;
  property_type: "sale" | "rent";
  category: string;
  status: string;
  price: string;
  address: string;
  locality: string;
  city: string;
  state: string;
  zip_code: string;
  bhk: string;
  beds: string;
  baths: string;
  area_sqft: string;
  carpet_area_sqft: string;
  year_built: string;
  floors: string;
  garage_spaces: string;
  latitude: string;
  longitude: string;
  possession_status: string;
  furnishing: string;
  transaction_type: string;
  is_verified: boolean;
  is_featured: boolean;
  features: string;          // comma-separated string in form, array on save
  image_urls: string[];      // Cloudinary/S3 URLs
  rera_number?: string;
}

const EMPTY_FORM: PropertyFormData = {
  title: "", description: "", property_type: "sale", category: "apartment",
  status: "active", price: "", address: "", locality: "", city: "", state: "", zip_code: "",
  bhk: "", beds: "", baths: "", area_sqft: "", carpet_area_sqft: "", year_built: "", floors: "1",
  garage_spaces: "0", latitude: "", longitude: "",
  possession_status: "ready_to_move", furnishing: "unfurnished", transaction_type: "new_booking",
  is_verified: false, is_featured: false,
  features: "", image_urls: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────

const fmtPrice = (v: number | string) => {
  const n = Number(v);
  if (!n) return "—";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${Math.round(n / 100_000)} L`;
  return `₹${n.toLocaleString("en-IN")}`;
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  active:    { bg: "#dcfce7", color: "#15803d" },
  pending:   { bg: "#fef3c7", color: "#b45309" },
  sold:      { bg: "#fee2e2", color: "#b91c1c" },
  rented:    { bg: "#ede9fe", color: "#6d28d9" },
  off_market:{ bg: "#f1f5f9", color: "#475569" },
};

// ─── Main Admin Component ─────────────────────────────────────────────────


/**
 * Turns a DRF validation error response into a readable message.
 *
 * DRF replies with { field: ["msg", ...] }, and nested serializers reply with
 * objects or arrays of objects. The previous version did
 * Object.values(data).flat().join(" "), which printed "[object Object]" for
 * anything nested and dropped the field name entirely — so a coordinate
 * precision error surfaced as a bare "Ensure that there are no more than 9
 * digits in total." with no clue which input to fix.
 */
function humanizeField(field: string): string {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function collectMessages(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(collectMessages);
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, inner]) => {
        const msgs = collectMessages(inner);
        return msgs.map((m) => `${humanizeField(key)}: ${m}`);
      }
    );
  }
  return [String(value)];
}

function formatApiError(err: any): string {
  const data = err?.response?.data;

  if (!data) {
    return err?.message
      ? `Save failed — ${err.message}`
      : "Save failed. Please check all required fields.";
  }

  if (typeof data === "string") return data;
  if (data.detail && typeof data.detail === "string") return data.detail;

  const messages = collectMessages(data);
  return messages.length
    ? messages.join("  •  ")
    : "Save failed. Please check all required fields.";
}

function AdminPanel() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  // /agent/listings/<slug>/edit redirects here with ?edit=<slug>
  const editSlug = searchParams.get("edit");
  const [view, setView] = useState<"list" | "form" | "inquiries">("list");
  const [properties, setProperties] = useState<PropertyCard[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type?: "ok" | "err" } | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PaginatedResponse<PropertyCard>>(
        "/properties/my_listings/"
      );
      setProperties(data.results);
    } catch {
      showToast("Could not load properties. Check your connection.", "err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadInquiries = useCallback(async () => {
    try {
      const { data } = await api.get<PaginatedResponse<Inquiry>>("/inquiries/");
      setInquiries(data.results);
    } catch {
      showToast("Could not load inquiries.", "err");
    }
  }, [showToast]);

  useEffect(() => {
    loadProperties();
    loadInquiries();
  }, [loadProperties, loadInquiries]);

  // Deep link support: ?edit=<slug> opens that listing straight in the form.
  // The list only holds summary data, so fetch the full record first —
  // otherwise the form would mount with half its fields empty.
  useEffect(() => {
    if (!editSlug || loading) return;

    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<Property>(`/properties/${editSlug}/`);
        if (cancelled) return;
        setEditingProp(data);
        setView("form");
      } catch {
        showToast("That listing could not be found.", "err");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editSlug, loading, showToast]);

  const handleSave = async (formData: PropertyFormData) => {
    const { rera_number, ...rest } = formData;
    const payload = {
      ...rest,
      price: Number(formData.price),
      bhk: formData.bhk ? Number(formData.bhk) : null,
      beds: Number(formData.beds),
      baths: Number(formData.baths),
      area_sqft: Number(formData.area_sqft),
      carpet_area_sqft: formData.carpet_area_sqft ? Number(formData.carpet_area_sqft) : null,
      year_built: formData.year_built ? Number(formData.year_built) : null,
      floors: Number(formData.floors) || 1,
      garage_spaces: Number(formData.garage_spaces) || 0,
      // Round to 8dp — matches the DecimalField precision on the backend.
      // Map/geolocation sources often emit 10+ decimals, which the API rejects.
      latitude: formData.latitude
        ? Number(Number(formData.latitude).toFixed(8))
        : null,
      longitude: formData.longitude
        ? Number(Number(formData.longitude).toFixed(8))
        : null,
      features: formData.features
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
      meta_description: rera_number
        ? `RERA: ${rera_number}.`
        : undefined,
    };

    try {
      if (editingProp) {
        await api.patch(`/properties/${editingProp.slug}/`, payload);
        showToast("Property updated — changes are live on the website.");
      } else {
        await api.post("/properties/", payload);
        showToast("Property published and now visible on the website.");
      }
      await loadProperties();
      setView("list");
      setEditingProp(null);
    } catch (err: any) {
      showToast(formatApiError(err), "err");
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm("Remove this property from the website?")) return;
    try {
      await api.delete(`/properties/${slug}/`);
      showToast("Property removed from the website.", "err");
      await loadProperties();
    } catch {
      showToast("Delete failed.", "err");
    }
  };

  const handleInqStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/inquiries/${id}/`, { status });
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: status as any } : i))
      );
    } catch {
      showToast("Could not update inquiry status.", "err");
    }
  };

  return (
    <div style={{ fontFamily: "Inter, -apple-system, sans-serif", fontSize: 14 }}>
      {/* Top nav */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {(["list", "form", "inquiries"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              if (v === "form") setEditingProp(null);
              setView(v);
            }}
            style={{
              padding: "8px 16px",
              border: "1px solid",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: view === v ? 600 : 400,
              background: view === v ? "#0f172a" : "#fff",
              color: view === v ? "#fff" : "#64748b",
              borderColor: view === v ? "#0f172a" : "#e2e8f0",
            }}
          >
            {{ list: "My listings", form: editingProp ? "Edit property" : "Add property", inquiries: `Inquiries ${inquiries.filter((i) => i.status === "new").length > 0 ? `(${inquiries.filter((i) => i.status === "new").length} new)` : ""}` }[v]}
          </button>
        ))}
      </div>

      {/* Views */}
      {view === "list" && (
        <PropertyList
          properties={properties}
          loading={loading}
          onEdit={(p) => { setEditingProp(p as any); setView("form"); }}
          onDelete={handleDelete}
          onAdd={() => { setEditingProp(null); setView("form"); }}
        />
      )}
      {view === "form" && (
        <PropertyForm
          initialData={editingProp}
          onSave={handleSave}
          onCancel={() => setView("list")}
          onUploadError={(msg) => showToast(msg, "err")}
        />
      )}
      {view === "inquiries" && (
        <InquiryList inquiries={inquiries} onStatus={handleInqStatus} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          padding: "12px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
          background: toast.type === "err" ? "#fef2f2" : "#f0fdf4",
          border: `1px solid ${toast.type === "err" ? "#fca5a5" : "#86efac"}`,
          color: toast.type === "err" ? "#dc2626" : "#16a34a",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        }}>
          {toast.type === "err" ? "✕ " : "✓ "}{toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── Property List ────────────────────────────────────────────────────────

function PropertyList({ properties, loading, onEdit, onDelete, onAdd }: {
  properties: PropertyCard[];
  loading: boolean;
  onEdit: (p: PropertyCard) => void;
  onDelete: (slug: string) => void;
  onAdd: () => void;
}) {
  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading listings…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={onAdd} style={{ padding: "9px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>
          + Add property
        </button>
      </div>

      {properties.length === 0 ? (
        <div style={{ padding: 64, textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", color: "#94a3b8" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏠</div>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>No listings yet</p>
          <button onClick={onAdd} style={{ padding: "9px 20px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13 }}>Add your first property</button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {properties.map((p) => {
            const st = STATUS_STYLE[p.status] || STATUS_STYLE.off_market;
            return (
              <div key={p.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 10, background: p.primary_image ? `url(${p.primary_image}) center/cover` : "#eff6ff", flexShrink: 0, border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
                  {!p.primary_image && "🏠"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2 }}>{p.bhk ? `${p.bhk} BHK ` : ""}{p.title}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{p.locality ? `${p.locality}, ` : ""}{p.city}, {p.state} · {p.beds}bd / {p.baths}ba · {p.area_sqft?.toLocaleString()} sqft</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 17, color: "#1d4ed8", flexShrink: 0 }}>{fmtPrice(p.price)}</div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: st.bg, color: st.color, textTransform: "capitalize", flexShrink: 0 }}>{p.status}</span>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => onEdit(p)} style={{ padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>Edit</button>
                  <button onClick={() => onDelete(p.slug)} style={{ padding: "7px 14px", border: "1px solid #fee2e2", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, color: "#dc2626" }}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Property Form ────────────────────────────────────────────────────────

function PropertyForm({ initialData, onSave, onCancel, onUploadError }: {
  initialData: Property | null;
  onSave: (data: PropertyFormData) => Promise<void>;
  onCancel: () => void;
  onUploadError?: (msg: string) => void;
}) {
  const [form, setForm] = useState<PropertyFormData>(() => {
    if (!initialData) return EMPTY_FORM;
    return {
      ...EMPTY_FORM,
      title: initialData.title,
      description: initialData.description,
      property_type: initialData.property_type,
      category: initialData.category,
      status: initialData.status,
      price: String(initialData.price),
      address: initialData.address,
      locality: initialData.locality ?? "",
      city: initialData.city,
      state: initialData.state,
      zip_code: initialData.zip_code,
      bhk: initialData.bhk ? String(initialData.bhk) : "",
      beds: String(initialData.beds),
      baths: String(initialData.baths),
      area_sqft: String(initialData.area_sqft),
      carpet_area_sqft: initialData.carpet_area_sqft ? String(initialData.carpet_area_sqft) : "",
      year_built: initialData.year_built ? String(initialData.year_built) : "",
      floors: String(initialData.floors),
      garage_spaces: String(initialData.garage_spaces),
      latitude: initialData.latitude ? String(initialData.latitude) : "",
      longitude: initialData.longitude ? String(initialData.longitude) : "",
      possession_status: initialData.possession_status ?? "ready_to_move",
      furnishing: initialData.furnishing ?? "unfurnished",
      transaction_type: initialData.transaction_type ?? "new_booking",
      is_verified: initialData.is_verified ?? false,
      is_featured: initialData.is_featured ?? false,
      features: Array.isArray(initialData.features) ? initialData.features.join(", ") : "",
      image_urls: initialData.images?.map((i) => i.image_url) ?? [],
    };
  });

  const [tab, setTab] = useState<"basic" | "location" | "images" | "amenities">("basic");
  const [saving, setSaving] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof PropertyFormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;

    // Upload to the backend, which stores the file and returns a real URL.
    // (Previously this used URL.createObjectURL(), producing `blob:` URLs that
    // only exist in this browser tab and that the API rejects as invalid.)
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));

      const { data } = await api.post<{ urls: string[] }>(
        "/properties/upload_image/",
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      set("image_urls", [...form.image_urls, ...data.urls]);
    } catch (err: any) {
      onUploadError?.(formatApiError(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  /**
   * Accepts what people actually paste. DRF's URLField needs a scheme, so a
   * bare "cdn.example.com/a.jpg" is rejected outright; we add https:// rather
   * than failing at submit time.
   */
  const normalizeUrl = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^(blob|data):/i.test(trimmed)) return trimmed; // caught by addUrl below
    return `https://${trimmed}`;
  };

  const addUrl = (raw: string) => {
    const url = normalizeUrl(raw);
    if (!url) return;
    if (/^(blob|data):/i.test(url)) {
      onUploadError?.(
        "That looks like a local preview link, not a hosted image. Use Choose files to upload it instead."
      );
      return;
    }
    set("image_urls", [...form.image_urls, url]);
    setNewUrl("");
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const inp = { padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", width: "100%", background: "#fff", boxSizing: "border-box" as const };
  const lbl = { fontSize: 12, fontWeight: 500 as const, color: "#374151", display: "block" as const, marginBottom: 5 };
  const fld = { marginBottom: 16 };

  const AMENITIES_QUICK = ["Swimming pool","Gymnasium","Club house","Landscaped garden","Jogging track","24/7 security","CCTV","Children's play area","Indoor games","Community hall","Covered parking","Power backup","Concierge","High-speed lift","EV charging","Yoga deck","Spa","Rainwater harvesting","Solar panels","Vastu compliant","Lake facing","Video door phone","Rooftop lounge","Pet-friendly"];

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={onCancel} style={{ padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>← Back</button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{initialData ? "Edit property" : "Add new property"}</h2>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: 24, background: "#fff", borderRadius: "12px 12px 0 0", overflow: "hidden" }}>
        {([["basic", "Basic info"], ["location", "Location"], ["images", `Images (${form.image_urls.length})`], ["amenities", "Amenities"]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 20px", border: "none", borderBottom: `2px solid ${tab === t ? "#3b82f6" : "transparent"}`, background: "transparent", color: tab === t ? "#3b82f6" : "#64748b", cursor: "pointer", fontSize: 13, fontWeight: tab === t ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 0 12px 12px", padding: 24 }}>

        {tab === "basic" && (
          <>
            <div style={fld}>
              <label style={lbl}>Property title *</label>
              <input style={inp} value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Godrej Blue — Luxury 3 & 4 BHK" />
            </div>
            <div style={fld}>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, height: 100, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Describe the property..." />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[
                ["Listing type", "property_type", [["sale","For Sale"],["rent","For Rent"]]],
                ["Category", "category", [["apartment","Apartment"],["house","House"],["condo","Condo"],["townhouse","Townhouse"],["land","Land"],["commercial","Commercial"]]],
                ["Status", "status", [["active","Active"],["pending","Pending"],["sold","Sold"],["rented","Rented"],["off_market","Off market"]]],
              ].map(([label, key, opts]: any) => (
                <div key={key}>
                  <label style={lbl}>{label}</label>
                  <select style={inp} value={(form as any)[key]} onChange={e => set(key, e.target.value)}>
                    {opts.map(([v, l]: string[]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl}>Price (₹) *</label>
                <input style={inp} type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="24000000" />
                {form.price && <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 3 }}>= {fmtPrice(form.price)}</div>}
              </div>
              <div>
                <label style={lbl}>Year built / possession</label>
                <input style={inp} type="number" value={form.year_built} onChange={e => set("year_built", e.target.value)} placeholder="2029" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div>
                <label style={lbl}>BHK configuration</label>
                <select style={inp} value={form.bhk} onChange={e => set("bhk", e.target.value)}>
                  <option value="">— Not applicable —</option>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} BHK</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Possession status</label>
                <select style={inp} value={form.possession_status} onChange={e => set("possession_status", e.target.value)}>
                  <option value="ready_to_move">Ready to Move</option>
                  <option value="under_construction">Under Construction</option>
                  <option value="new_launch">New Launch</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Transaction type</label>
                <select style={inp} value={form.transaction_type} onChange={e => set("transaction_type", e.target.value)}>
                  <option value="new_booking">New Booking</option>
                  <option value="resale">Resale</option>
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Furnishing</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["unfurnished", "Unfurnished"], ["semi_furnished", "Semi-Furnished"], ["fully_furnished", "Fully Furnished"]].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set("furnishing", v)} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${form.furnishing === v ? "#3b82f6" : "#e2e8f0"}`, background: form.furnishing === v ? "#eff6ff" : "#fff", color: form.furnishing === v ? "#1d4ed8" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
              {[["beds","Bedrooms *","3"],["baths","Bathrooms *","3"],["area_sqft","Super Area (sqft) *","1507"],["floors","Floors","20"]].map(([k, l, ph]) => (
                <div key={k}><label style={lbl}>{l}</label><input style={inp} type="number" value={(form as any)[k]} onChange={e => set(k as any, e.target.value)} placeholder={ph} /></div>
              ))}
            </div>
          </>
        )}

        {tab === "location" && (
          <>
            <div style={fld}>
              <label style={lbl}>Full address *</label>
              <input style={inp} value={form.address} onChange={e => set("address", e.target.value)} placeholder="B.L. Saha Road, New Alipore" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <div><label style={lbl}>Locality / neighbourhood</label><input style={inp} value={form.locality} onChange={e => set("locality", e.target.value)} placeholder="New Alipore" /></div>
              <div><label style={lbl}>Carpet area (sqft)</label><input style={inp} type="number" value={form.carpet_area_sqft} onChange={e => set("carpet_area_sqft", e.target.value)} placeholder="1210" /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
              {[["city","City *","Kolkata"],["state","State","West Bengal"],["zip_code","PIN code","700053"]].map(([k,l,ph]) => (
                <div key={k}><label style={lbl}>{l}</label><input style={inp} value={(form as any)[k]} onChange={e => set(k as any, e.target.value)} placeholder={ph} /></div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div><label style={lbl}>Latitude (for map pin)</label><input style={inp} type="number" step="0.0001" value={form.latitude} onChange={e => set("latitude", e.target.value)} placeholder="22.5100" /></div>
              <div><label style={lbl}>Longitude (for map pin)</label><input style={inp} type="number" step="0.0001" value={form.longitude} onChange={e => set("longitude", e.target.value)} placeholder="88.3300" /></div>
            </div>
            <div style={{ marginTop: 14, padding: 12, background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
              💡 Right-click on Google Maps → "What's here?" to get the lat/lng for the exact property location.
            </div>
          </>
        )}

        {tab === "images" && (
          <>
            <div
              style={{ border: "2px dashed #bfdbfe", borderRadius: 12, padding: 28, textAlign: "center", marginBottom: 20, background: "#f8fafc", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            >
              <div style={{ fontSize: 36, marginBottom: 8 }}>{uploading ? "⏳" : "📷"}</div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {uploading ? "Uploading…" : "Click or drag photos here"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>JPG, PNG, WebP · Max 10 MB each · First image becomes the cover photo</div>
              <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={e => e.target.files && handleFiles(e.target.files)} />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="Or paste Cloudinary / S3 image URL…" style={{ ...inp, flex: 1 }} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addUrl(newUrl); }}} />
              <button onClick={() => addUrl(newUrl)} style={{ padding: "9px 16px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#f8fafc", cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" }}>Add URL</button>
            </div>
            {form.image_urls.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
                {form.image_urls.map((url, i) => (
                  <div key={i} style={{ border: `2px solid ${i === 0 ? "#3b82f6" : "#e2e8f0"}`, borderRadius: 10, overflow: "hidden", position: "relative" }}>
                    <div style={{ height: 90, background: "#f1f5f9", overflow: "hidden" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                    <div style={{ padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {i === 0 ? <span style={{ fontSize: 10, fontWeight: 700, color: "#1d4ed8" }}>COVER</span> : <button onClick={() => set("image_urls", [url, ...form.image_urls.filter((_, j) => j !== i)])} style={{ fontSize: 10, color: "#64748b", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Set cover</button>}
                      <button onClick={() => set("image_urls", form.image_urls.filter((_, j) => j !== i))} style={{ fontSize: 12, color: "#dc2626", background: "none", border: "none", cursor: "pointer", padding: 0 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: 24 }}>No images yet — upload files or paste URLs above</div>
            )}
          </>
        )}

        {tab === "amenities" && (
          <>
            <div style={fld}>
              <label style={lbl}>Amenities & features</label>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Comma-separated — each becomes a visible tag on the property listing page</div>
              <textarea style={{ ...inp, height: 110, resize: "vertical" }} value={form.features} onChange={e => set("features", e.target.value)} placeholder="Swimming pool, Gymnasium, Club house, 24/7 security…" />
            </div>
            {form.features && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                {form.features.split(",").map(f => f.trim()).filter(Boolean).map((f, i) => (
                  <span key={i} style={{ fontSize: 12, background: "#eff6ff", color: "#1d4ed8", padding: "3px 9px", borderRadius: 20, border: "1px solid #bfdbfe" }}>{f}</span>
                ))}
              </div>
            )}
            <div>
              <label style={{ ...lbl, marginBottom: 10 }}>Quick-add</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {AMENITIES_QUICK.map(f => {
                  const active = form.features.toLowerCase().includes(f.toLowerCase());
                  return (
                    <button key={f} onClick={() => {
                      const arr = form.features.split(",").map(s => s.trim()).filter(Boolean);
                      set("features", active ? arr.filter(a => a.toLowerCase() !== f.toLowerCase()).join(", ") : [...arr, f].join(", "));
                    }} style={{ fontSize: 12, padding: "5px 11px", borderRadius: 20, border: `1px solid ${active ? "#3b82f6" : "#e2e8f0"}`, background: active ? "#eff6ff" : "#fff", color: active ? "#1d4ed8" : "#64748b", cursor: "pointer" }}>
                      {active ? "✓ " : "+ "}{f}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <label style={lbl}>RERA registration number</label>
              <input style={inp} value={form.rera_number || ""} onChange={e => set("rera_number" as any, e.target.value)} placeholder="e.g. WBRERA/P/KOL/2024/002211" />
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>Shown with a verified ✓ badge on the public listing</div>
            </div>
            <div style={{ marginTop: 20, borderTop: "1px solid #f1f5f9", paddingTop: 16, display: "flex", gap: 24 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#374151" }}>
                <input type="checkbox" checked={form.is_verified} onChange={e => set("is_verified", e.target.checked)} />
                ✓ Verified listing
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#374151" }}>
                <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} />
                ★ Feature on homepage
              </label>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <button onClick={onCancel} style={{ padding: "10px 20px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <button onClick={handleSubmit} disabled={saving} style={{ padding: "10px 28px", background: saving ? "#94a3b8" : "#16a34a", color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600 }}>
          {saving ? "Saving…" : initialData ? "Save & publish changes" : "Publish property →"}
        </button>
      </div>
    </div>
  );
}

// ─── Inquiry List ─────────────────────────────────────────────────────────

function InquiryList({ inquiries, onStatus }: { inquiries: Inquiry[]; onStatus: (id: number, status: string) => void }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const filtered = inquiries.filter(i => filter === "all" || i.status === filter);
  const INQ_STYLE: Record<string, { bg: string; color: string }> = {
    new: { bg: "#dbeafe", color: "#1d4ed8" }, read: { bg: "#f1f5f9", color: "#475569" },
    responded: { bg: "#dcfce7", color: "#15803d" }, closed: { bg: "#f8fafc", color: "#94a3b8" },
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "new", "read", "responded", "closed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", border: "1px solid", borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: "pointer", textTransform: "capitalize" as const, background: filter === f ? "#0f172a" : "#fff", color: filter === f ? "#fff" : "#64748b", borderColor: filter === f ? "#0f172a" : "#e2e8f0" }}>
            {f}{f === "new" && inquiries.filter(i => i.status === "new").length > 0 ? ` (${inquiries.filter(i => i.status === "new").length})` : ""}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(inq => {
          const st = INQ_STYLE[inq.status] || INQ_STYLE.read;
          return (
            <div key={inq.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer" }} onClick={() => { setExpanded(expanded === inq.id ? null : inq.id); if (inq.status === "new") onStatus(inq.id, "read"); }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#1d4ed8", fontSize: 15, flexShrink: 0 }}>{inq.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{inq.name}</span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{new Date(inq.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 3 }}>{inq.email} · re: <strong>{inq.property_title}</strong></div>
                  <div style={{ fontSize: 13, color: "#374151", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{inq.message}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: st.bg, color: st.color, textTransform: "capitalize" as const, flexShrink: 0 }}>{inq.status}</span>
              </div>
              {expanded === inq.id && (
                <div style={{ padding: "0 20px 16px", borderTop: "1px solid #f1f5f9" }}>
                  <p style={{ padding: "14px 0", margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6 }}>{inq.message}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a href={`mailto:${inq.email}?subject=Re: ${inq.property_title}`} style={{ padding: "7px 14px", background: "#3b82f6", color: "#fff", textDecoration: "none", borderRadius: 8, fontSize: 12, fontWeight: 500 }}>Reply by email</a>
                    {inq.phone && <a href={`tel:${inq.phone}`} style={{ padding: "7px 14px", border: "1px solid #e2e8f0", color: "#374151", textDecoration: "none", borderRadius: 8, fontSize: 12 }}>Call {inq.phone}</a>}
                    {inq.status !== "responded" && <button onClick={() => onStatus(inq.id, "responded")} style={{ padding: "7px 14px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12 }}>Mark responded</button>}
                    {inq.status !== "closed" && <button onClick={() => onStatus(inq.id, "closed")} style={{ padding: "7px 14px", border: "1px solid #fee2e2", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 12, color: "#dc2626" }}>Close</button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", color: "#94a3b8" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>💬</div>
            <p style={{ margin: 0 }}>No {filter !== "all" ? filter : ""} inquiries</p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminPanel />
    </Suspense>
  );
}
