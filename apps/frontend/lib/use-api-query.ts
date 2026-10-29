"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "./api-client";
import { apiQueryKey } from "./query-client";

export function useApiQuery<T>(
  endpoint: string,
  options: { enabled?: boolean; initialData?: T } = {},
) {
  return useQuery<T>({
    queryKey: apiQueryKey(endpoint),
    queryFn: ({ signal }) =>
      apiClient<T>(endpoint, {
        signal,
        queryCache: false,
        timeoutMs: endpoint.includes("/html") ? 60000 : 15000,
      }),
    ...options,
  });
}
