"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiClient } from "../lib/api-client";

export function useFetch<T = unknown>(endpoint: string, options?: RequestInit) {
  const optionsRef = useRef(options);
  const controllerRef = useRef<AbortController | null>(null);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current?.abort();
    controllerRef.current = controller;
    setLoading(true);
    setError(null);

    apiClient<T>(endpoint, { ...optionsRef.current, signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Failed to fetch data.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [endpoint, revision]);

  const refetch = useCallback(() => setRevision((current) => current + 1), []);
  const abort = useCallback(() => controllerRef.current?.abort(), []);

  return { data, loading, error, refetch, abort };
}
