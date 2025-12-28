export function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  return baseUrl && baseUrl.trim() ? baseUrl.trim() : "http://localhost:4000";
}
