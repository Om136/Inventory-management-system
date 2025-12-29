"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";
import { StatusBadge } from "@/components/StatusBadge";

function formatLastMoved(lastMovementAt) {
  if (!lastMovementAt) return "—";
  const d = new Date(lastMovementAt);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function InventoryClient() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [deadDays, setDeadDays] = useState(60);
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet(`/dashboard/inventory?deadDays=${deadDays}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Failed to load inventory");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadDays]);

  const locations = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (r?.location?.id) map.set(String(r.location.id), r.location.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (locationId && String(r.location?.id) !== locationId) return false;
      if (!q) return true;
      const sku = String(r.product?.skuCode || "").toLowerCase();
      const name = String(r.product?.name || "").toLowerCase();
      const loc = String(r.location?.name || "").toLowerCase();
      return sku.includes(q) || name.includes(q) || loc.includes(q);
    });
  }, [rows, search, locationId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Inventory</h1>
          {/* <p className="text-sm text-zinc-600">
            Source of truth across products and locations.
          </p> */}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div>
            <label className="text-xs font-semibold text-zinc-700">
              Dead stock
            </label>
            <select
              value={deadDays}
              onChange={(e) => setDeadDays(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search SKU, product, location…"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
            />

            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm sm:max-w-xs"
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={load}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-semibold text-zinc-700">
                <th className="border-b border-zinc-200 px-3 py-2">Material</th>
                <th className="border-b border-zinc-200 px-3 py-2">Location</th>
                <th className="border-b border-zinc-200 px-3 py-2">Quantity</th>
                <th className="border-b border-zinc-200 px-3 py-2">
                  Last moved
                </th>
                <th className="border-b border-zinc-200 px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-sm text-zinc-600">
                    Loading inventory…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((r) => {
                  const isDead = r.status === "DEAD";
                  return (
                    <tr
                      key={`${r.product?.id}-${r.location?.id}`}
                      className={isDead ? "bg-red-50" : ""}
                    >
                      <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                        <div className="text-zinc-900">{r.product?.name}</div>
                        <div className="text-xs text-zinc-600">
                          Unit: {r.product?.unit}
                        </div>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                        {r.location?.name}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                        {r.quantity} {r.product?.unit}
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                        {formatLastMoved(r.lastMovementAt)}
                        <div className="text-xs text-zinc-600">
                          {r.daysIdle} days idle
                        </div>
                      </td>
                      <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-sm text-zinc-600">
                    No rows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
