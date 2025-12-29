"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet, apiPost } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

const TYPES = [
  { value: "IN", label: "IN" },
  { value: "OUT", label: "OUT" },
  { value: "DAMAGE", label: "DAMAGE" },
  { value: "TRANSFER", label: "TRANSFER" },
];

function toNumberOrEmpty(value) {
  if (value === "") return "";
  const n = Number(value);
  return Number.isFinite(n) ? n : "";
}

function LocationSelect({
  label,
  value,
  onChange,
  locations,
  disabled,
  placeholder,
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-zinc-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm disabled:bg-zinc-50"
      >
        <option value="">{placeholder}</option>
        {locations.map((l) => (
          <option key={l.id} value={String(l.id)}>
            {l.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function MoveStockClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const [type, setType] = useState("TRANSFER");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [fromLocationId, setFromLocationId] = useState("");
  const [toLocationId, setToLocationId] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  async function loadLookups() {
    setLoading(true);
    setError("");
    try {
      const [p, l] = await Promise.all([
        apiGet("/products"),
        apiGet("/locations"),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setLocations(Array.isArray(l) ? l : []);
    } catch (e) {
      setError(e.message || "Failed to load products/locations");
      setProducts([]);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => String(p.id) === String(productId)) || null;
  }, [products, productId]);

  // Keep fields consistent when type changes
  useEffect(() => {
    setResult(null);
    setError("");

    if (type === "IN") {
      setFromLocationId("");
    }
    if (type === "OUT" || type === "DAMAGE") {
      setToLocationId("");
    }
  }, [type]);

  async function submit(e) {
    e.preventDefault();

    setResult(null);
    setError("");

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);

    try {
      const body = {
        productId: toNumberOrEmpty(productId),
        type,
        quantity: toNumberOrEmpty(quantity),
        reason: reason.trim() ? reason.trim() : null,
        fromLocationId: fromLocationId ? toNumberOrEmpty(fromLocationId) : null,
        toLocationId: toLocationId ? toNumberOrEmpty(toLocationId) : null,
      };

      const data = await apiPost("/stock/move", body);
      setResult(data);
    } catch (e2) {
      setError(e2.message || "Move failed");
    } finally {
      setSubmitting(false);
    }
  }

  const needsFrom = type === "OUT" || type === "DAMAGE" || type === "TRANSFER";
  const needsTo = type === "IN" || type === "TRANSFER";

  const validationMessage = useMemo(() => {
    if (loading) return "";
    if (!productId) return "Select a product.";

    const qty = Number(quantity);
    if (!quantity || !Number.isFinite(qty) || qty <= 0)
      return "Enter a quantity > 0.";

    if (needsFrom && !fromLocationId) return "Select a From location.";
    if (needsTo && !toLocationId) return "Select a To location.";

    if (
      type === "TRANSFER" &&
      fromLocationId &&
      toLocationId &&
      fromLocationId === toLocationId
    ) {
      return "TRANSFER requires From and To to be different.";
    }

    return "";
  }, [
    loading,
    productId,
    quantity,
    needsFrom,
    needsTo,
    fromLocationId,
    toLocationId,
    type,
  ]);

  const canSubmit = !validationMessage && !submitting && !loading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900">Move Stock</h1>
        <p className="text-sm text-zinc-600">
          Record IN/OUT/DAMAGE/TRANSFER. Stock updates happen automatically.
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Movement</h2>
          <button
            type="button"
            onClick={loadLookups}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Reload
          </button>
        </div>

        {loading ? (
          <p className="mt-3 text-sm text-zinc-600">Loading…</p>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        <form
          onSubmit={submit}
          className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <div>
            <label className="text-xs font-semibold text-zinc-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  [{p.skuCode}] {p.name}
                </option>
              ))}
            </select>
            {selectedProduct ? (
              <div className="mt-1 text-xs text-zinc-600">
                Unit: {selectedProduct.unit} • Reorder:{" "}
                {selectedProduct.reorderLevel}
              </div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700">
              Quantity
            </label>
            <input
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              inputMode="decimal"
              placeholder={
                selectedProduct
                  ? `e.g. 10 (${selectedProduct.unit})`
                  : "e.g. 10"
              }
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-700">
              Reason (optional)
            </label>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. supplier delivery, site issue, breakage…"
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          {needsFrom ? (
            <LocationSelect
              label="From location"
              value={fromLocationId}
              onChange={setFromLocationId}
              locations={locations}
              disabled={false}
              placeholder="Select from…"
            />
          ) : null}

          {needsTo ? (
            <LocationSelect
              label="To location"
              value={toLocationId}
              onChange={setToLocationId}
              locations={locations}
              disabled={false}
              placeholder="Select to…"
            />
          ) : null}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {submitting ? "Saving…" : "Record movement"}
            </button>

            {validationMessage ? (
              <p className="mt-2 text-xs text-zinc-700">{validationMessage}</p>
            ) : (
              <p className="mt-2 text-xs text-zinc-600">
                Tip: stock can’t go negative; the API will reject invalid moves.
              </p>
            )}
          </div>
        </form>
      </section>

      {result ? (
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Result</h2>

          <div className="mt-2 text-sm text-zinc-800">
            Movement #{result.movement?.id} saved ({result.movement?.type}).
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-zinc-200 p-3">
              <div className="text-xs font-semibold text-zinc-700">From</div>
              <div className="mt-1 text-sm text-zinc-900">
                Qty: {result.stock?.from?.quantity ?? "—"}
              </div>
              {result.inventory?.from ? (
                <div className="mt-2">
                  <StatusBadge status={result.inventory.from.status} />
                  <div className="mt-1 text-xs text-zinc-600">
                    {result.inventory.from.daysIdle} days idle
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-md border border-zinc-200 p-3">
              <div className="text-xs font-semibold text-zinc-700">To</div>
              <div className="mt-1 text-sm text-zinc-900">
                Qty: {result.stock?.to?.quantity ?? "—"}
              </div>
              {result.inventory?.to ? (
                <div className="mt-2">
                  <StatusBadge status={result.inventory.to.status} />
                  <div className="mt-1 text-xs text-zinc-600">
                    {result.inventory.to.daysIdle} days idle
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
