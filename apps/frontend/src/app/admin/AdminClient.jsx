"use client";

import { useState } from "react";

import { apiPost } from "@/lib/api";
import { getApiBaseUrl } from "@/lib/config";
import { ProductEditor } from "@/components/ProductEditor";

export function AdminClient() {
  const [productEditorKey, setProductEditorKey] = useState(0);

  const [newSkuCode, setNewSkuCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("");
  const [newReorderLevel, setNewReorderLevel] = useState("0");
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createProductError, setCreateProductError] = useState("");
  const [createProductSuccess, setCreateProductSuccess] = useState("");

  const [newLocationName, setNewLocationName] = useState("");
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [createLocationError, setCreateLocationError] = useState("");
  const [createLocationSuccess, setCreateLocationSuccess] = useState("");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  async function createProduct(e) {
    e.preventDefault();
    setCreatingProduct(true);
    setCreateProductError("");
    setCreateProductSuccess("");

    try {
      const skuCode = newSkuCode.trim();
      const name = newName.trim();
      const unit = newUnit.trim();
      const reorderLevel = Number(newReorderLevel);

      if (!skuCode) throw new Error("skuCode is required");
      if (!name) throw new Error("name is required");
      if (!unit) throw new Error("unit is required");
      if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
        throw new Error("reorderLevel must be a number >= 0");
      }

      const created = await apiPost("/products", {
        skuCode,
        name,
        unit,
        reorderLevel: Math.trunc(reorderLevel),
      });

      setCreateProductSuccess(`Created: ${created.skuCode}`);
      setNewSkuCode("");
      setNewName("");
      setNewUnit("");
      setNewReorderLevel("0");

      setProductEditorKey((k) => k + 1);
    } catch (err) {
      setCreateProductError(err.message || "Failed to create product");
    } finally {
      setCreatingProduct(false);
    }
  }

  async function createLocation(e) {
    e.preventDefault();
    setCreatingLocation(true);
    setCreateLocationError("");
    setCreateLocationSuccess("");

    try {
      const name = newLocationName.trim();
      if (!name) throw new Error("name is required");

      const created = await apiPost("/locations", { name });
      setCreateLocationSuccess(`Created: ${created.name}`);
      setNewLocationName("");
    } catch (err) {
      setCreateLocationError(err.message || "Failed to create location");
    } finally {
      setCreatingLocation(false);
    }
  }

  async function exportInventorySnapshot() {
    setExporting(true);
    setExportError("");

    try {
      const deadDays = 60;
      const url = `${getApiBaseUrl()}/exports/inventory-snapshot.xlsx?deadDays=${deadDays}`;
      // Let the browser download the file (backend generates valid .xlsx).
      window.location.assign(url);
    } catch (err) {
      setExportError(err.message || "Failed to export inventory snapshot");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">Admin</h1>
        <p className="text-sm text-zinc-600">
          Product master data tools (create and edit).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Add product</h2>
            <p className="text-xs text-zinc-600">
              Create a new material in the catalog.
            </p>
          </div>

          {createProductError ? (
            <p className="mt-3 text-sm text-red-700">{createProductError}</p>
          ) : null}
          {createProductSuccess ? (
            <p className="mt-3 text-sm text-green-700">
              {createProductSuccess}
            </p>
          ) : null}

          <form onSubmit={createProduct} className="mt-3 space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-zinc-700">
                  SKU code
                </label>
                <input
                  value={newSkuCode}
                  onChange={(e) => setNewSkuCode(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g. RM-001"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700">
                  Reorder level
                </label>
                <input
                  value={newReorderLevel}
                  onChange={(e) => setNewReorderLevel(e.target.value)}
                  inputMode="numeric"
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">
                  Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g. Steel Rod"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-700">
                  Unit
                </label>
                <input
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="e.g. pcs, kg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creatingProduct}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {creatingProduct ? "Creating…" : "Create product"}
            </button>
          </form>
        </section>

        <ProductEditor key={productEditorKey} />

        <section className="rounded-lg border border-zinc-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Add location
            </h2>
            <p className="text-xs text-zinc-600">Create a new storage area.</p>
          </div>

          {createLocationError ? (
            <p className="mt-3 text-sm text-red-700">{createLocationError}</p>
          ) : null}
          {createLocationSuccess ? (
            <p className="mt-3 text-sm text-green-700">
              {createLocationSuccess}
            </p>
          ) : null}

          <form onSubmit={createLocation} className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700">
                Location name
              </label>
              <input
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
                placeholder="e.g. Warehouse A"
              />
            </div>

            <button
              type="submit"
              disabled={creatingLocation}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {creatingLocation ? "Creating…" : "Create location"}
            </button>
          </form>
        </section>

        <section className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              Inventory Snapshot Export
            </h2>
            <p className="text-xs text-zinc-600">
              Download current inventory snapshot as Excel
            </p>
          </div>

          {exportError ? (
            <p className="mt-3 text-sm text-red-700">{exportError}</p>
          ) : null}

          <div className="mt-auto pt-3">
            <button
              type="button"
              onClick={exportInventorySnapshot}
              disabled={exporting}
              className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {exporting
                ? "Preparing…"
                : "Download current inventory snapshot as Excel"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
