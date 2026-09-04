import "server-only"

export function getBackendUrl(path: string): URL {
  const baseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3000"
  return new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`)
}
