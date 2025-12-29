import { getApiBaseUrl } from "./config";

export function downloadInventorySnapshotExcel({ deadDays = 60 } = {}) {
  const url = `${getApiBaseUrl()}/exports/inventory-snapshot.xlsx?deadDays=${encodeURIComponent(
    deadDays,
  )}`;

  window.location.href = url;
}
