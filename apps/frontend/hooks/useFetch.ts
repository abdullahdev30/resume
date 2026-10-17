"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useFetch<T = unknown>(
  endpoint: string,
  options?: RequestInit,
  timeoutMs = 10_000,
) {
  const optionsRef = useRef(options);
  const controllerRef = useRef<AbortController | null>(null);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: true, error: null });

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    const upstreamSignal = optionsRef.current?.signal;
    const abortFromUpstream = () => controller.abort(upstreamSignal?.reason);
    upstreamSignal?.addEventListener("abort", abortFromUpstream, { once: true });
    const timeout = window.setTimeout(() => controller.abort(new DOMException("Request timed out", "TimeoutError")), timeoutMs);

    setState((current) => ({ ...current, loading: true, error: null }));
    void fetch(endpoint, { ...optionsRef.current, signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Request failed with status ${response.status}.`);
        if (response.status === 204) return null as T;
        return response.json() as Promise<T>;
      })
      .then((data) => {
        if (!controller.signal.aborted) setState({ data, loading: false, error: null });
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted && controller.signal.reason?.name !== "TimeoutError") return;
        const message = controller.signal.reason?.name === "TimeoutError"
          ? "The request timed out."
          : requestError instanceof Error ? requestError.message : "Failed to fetch data.";
        setState((current) => ({ ...current, loading: false, error: message }));
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      upstreamSignal?.removeEventListener("abort", abortFromUpstream);
      controller.abort();
    };
  }, [endpoint, revision, timeoutMs]);

  const refetch = useCallback(() => setRevision((current) => current + 1), []);
  const abort = useCallback(() => controllerRef.current?.abort(), []);

  return { ...state, refetch, abort };
}
