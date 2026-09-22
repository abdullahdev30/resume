"use client";

import { useEffect, useState } from "react";

type UseFetchState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function useFetch<T>(url: string, timeoutMs = 10_000): UseFetchState<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);

    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }));
      try {
        const response = await fetch(url, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Request failed");
        }
        setState({
          data: (await response.json()) as T,
          error: null,
          loading: false,
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Request failed",
            loading: false,
          });
        }
      } finally {
        globalThis.clearTimeout(timeout);
      }
    }

    void load();

    return () => {
      controller.abort();
      globalThis.clearTimeout(timeout);
    };
  }, [timeoutMs, url]);

  return state;
}
