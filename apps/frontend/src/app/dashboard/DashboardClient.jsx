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

function KpiCard({ label, value }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="text-xs font-semibold text-zinc-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function AlertsTable({ title, rows }) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
        <div className="text-xs text-zinc-600">{rows.length} items</div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-left text-xs font-semibold text-zinc-700">
              <th className="border-b border-zinc-200 px-3 py-2">Material</th>
              <th className="border-b border-zinc-200 px-3 py-2">Location</th>
              <th className="border-b border-zinc-200 px-3 py-2">Quantity</th>
              <th className="border-b border-zinc-200 px-3 py-2">Last moved</th>
              <th className="border-b border-zinc-200 px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((r) => (
                <tr key={`${r.product?.id}-${r.location?.id}`}>
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
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-sm text-zinc-600">
                  Nothing to show.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function DashboardClient() {
  const [deadDays, setDeadDays] = useState(60);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState({ low: [], dead: [] });

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet(`/dashboard/alerts?deadDays=${deadDays}`);
      setAlerts({
        low: Array.isArray(data?.low) ? data.low : [],
        dead: Array.isArray(data?.dead) ? data.dead : [],
      });
    } catch (e) {
      setError(e.message || "Failed to load alerts");
      setAlerts({ low: [], dead: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadDays]);

  const deadTop = useMemo(() => {
    return [...alerts.dead]
      .sort((a, b) => Number(b?.daysIdle || 0) - Number(a?.daysIdle || 0))
      .slice(0, 10);
  }, [alerts.dead]);

  const lowTop = useMemo(() => {
    function urgency(r) {
      const rl = Number(r?.product?.reorderLevel ?? 0);
      const qty = Number(r?.quantity ?? 0);
      return rl - qty;
    }

    return [...alerts.low].sort((a, b) => urgency(b) - urgency(a)).slice(0, 10);
  }, [alerts.low]);

  const lowCount = alerts.low.length;
  const deadCount = alerts.dead.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600">
            What needs attention right now.
          </p>
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

          <button
            type="button"
            onClick={load}
            className="h-10 self-end rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Low stock" value={loading ? "…" : lowCount} />
        <KpiCard label="Dead stock" value={loading ? "…" : deadCount} />
        <KpiCard
          label="Needs attention"
          value={loading ? "…" : lowCount + deadCount}
        />
      </div>

      <AlertsTable title="Dead stock (top 10)" rows={loading ? [] : deadTop} />
      <AlertsTable title="Low stock (top 10)" rows={loading ? [] : lowTop} />

      {loading ? <p className="text-sm text-zinc-600">Loading…</p> : null}
    </div>
  );
}
