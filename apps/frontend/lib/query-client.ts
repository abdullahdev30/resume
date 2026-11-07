import { QueryClient } from "@tanstack/react-query";

let browserClient: QueryClient | undefined;
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") return new QueryClient();
  return (browserClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));
}
export const apiQueryKey = (endpoint: string) => ["api", endpoint] as const;

export const apiStaleTime = (endpoint: string) =>
  endpoint === "/billing/me" || endpoint.endsWith("/pdf") ? 30_000 : 5 * 60_000;
