"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPatch } from "@/lib/api";

function toIntOrEmpty(value) {
  if (value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return Math.trunc(n);
}

export function ProductEditor({ onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [products, setProducts] = useState([]);
  const [productId, setProductId] = useState("");

  const selected = useMemo(() => {
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [products, productId]);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await apiGet("/products");
      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      if (!productId && list.length) setProductId(String(list[0].id));
    } catch (e) {
      setError(e.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setError("");
    setSuccess("");
    if (!selected) {
      setName("");
      setUnit("");
      setReorderLevel("");
      return;
    }

    setName(selected.name || "");
    setUnit(selected.unit || "");
    setReorderLevel(
      selected.reorderLevel == null ? "" : String(selected.reorderLevel)
    );
  }, [selected]);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (!productId) throw new Error("Select a product");
      const body = {
        name,
        unit,
        reorderLevel: toIntOrEmpty(reorderLevel),
      };

      const updated = await apiPatch(`/products/${productId}`, body);
      setSuccess(`Saved: ${updated.skuCode}`);

      // Keep list in sync for next selects.
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
      );

      if (typeof onSaved === "function") onSaved(updated);
    } catch (e2) {
      setError(e2.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Edit product</h2>
          <p className="text-xs text-zinc-600">
            Update master data like reorder level (does not change stock).
          </p>
        </div>
        <button
          type="button"
          onClick={loadProducts}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Reload
        </button>
      </div>

      {loading ? <p className="mt-3 text-sm text-zinc-600">Loading…</p> : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {success ? (
        <p className="mt-3 text-sm text-green-700">{success}</p>
      ) : null}

      <form
        onSubmit={save}
        className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-zinc-700">Product</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            {products.map((p) => (
              <option key={p.id} value={String(p.id)}>
                [{p.skuCode}] {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">Unit</label>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700">
            Reorder level
          </label>
          <input
            value={reorderLevel}
            onChange={(e) => setReorderLevel(e.target.value)}
            inputMode="numeric"
            className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
          {/* <p className="mt-1 text-xs text-zinc-600">
            Must be a whole number ≥ 0.
          </p> */}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving || loading || !productId}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}
