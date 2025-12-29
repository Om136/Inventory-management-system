"use client";

import { useEffect, useMemo, useState } from "react";

import { apiGet } from "@/lib/api";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

function formatLocation(loc) {
  if (!loc) return "—";
  return loc.name || "—";
}

export function MovementsClient() {
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const canLoadMore = Boolean(nextCursor);

  async function loadFirstPage() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/stock/movements?limit=50");
      setItems(Array.isArray(data?.items) ? data.items : []);
      setNextCursor(data?.nextCursor ?? null);
    } catch (e) {
      setError(e.message || "Failed to load movements");
      setItems([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    setError("");

    try {
      const data = await apiGet(`/stock/movements?limit=50&cursor=${nextCursor}`);
      const newItems = Array.isArray(data?.items) ? data.items : [];
      setItems((prev) => [...prev, ...newItems]);
      setNextCursor(data?.nextCursor ?? null);
    } catch (e) {
      setError(e.message || "Failed to load more movements");
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    loadFirstPage();
  }, []);

  const rows = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Audit Trail</h1>
          <p className="text-sm text-zinc-600">All stock movements (newest first).</p>
        </div>

        <button
          type="button"
          onClick={loadFirstPage}
          className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          Refresh
        </button>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs font-semibold text-zinc-700">
                <th className="border-b border-zinc-200 px-3 py-2">When</th>
                <th className="border-b border-zinc-200 px-3 py-2">Type</th>
                <th className="border-b border-zinc-200 px-3 py-2">Material</th>
                <th className="border-b border-zinc-200 px-3 py-2">From</th>
                <th className="border-b border-zinc-200 px-3 py-2">To</th>
                <th className="border-b border-zinc-200 px-3 py-2">Qty</th>
                <th className="border-b border-zinc-200 px-3 py-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-sm text-zinc-600">
                    Loading movements…
                  </td>
                </tr>
              ) : rows.length ? (
                rows.map((m) => (
                  <tr key={m.id}>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {m.type}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {m.product?.name || "—"}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {formatLocation(m.fromLocation)}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {formatLocation(m.toLocation)}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {m.quantity} {m.product?.unit || ""}
                    </td>
                    <td className="border-b border-zinc-100 px-3 py-2 text-sm">
                      {m.reason || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-sm text-zinc-600">
                    No movements found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-zinc-600">Showing {rows.length} movements</div>
          <button
            type="button"
            onClick={loadMore}
            disabled={!canLoadMore || loadingMore || loading}
            className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : canLoadMore ? "Load more" : "No more"}
          </button>
        </div>
      </section>
    </div>
  );
}
