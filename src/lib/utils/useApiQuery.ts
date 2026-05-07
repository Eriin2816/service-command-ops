"use client";

import { useState, useEffect, useCallback } from "react";

interface ApiQueryState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface UseApiQueryResult<T> extends ApiQueryState<T> {
  retry: () => void;
}

/**
 * Wraps fetch with consistent loading / error / data states.
 *
 * - Auto-fetches on mount and whenever `url` changes.
 * - Expects the API to return `{ data: T }` or `{ error: string }`.
 * - `retry` re-runs the fetch immediately.
 *
 * Usage:
 *   const { data, error, loading, retry } = useApiQuery<WorkOrder[]>("/api/work-orders");
 */
export function useApiQuery<T>(url: string): UseApiQueryResult<T> {
  const [state, setState] = useState<ApiQueryState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(url);
      const json = (await res.json()) as { data?: T; error?: string };
      if (json.error) {
        setState({ data: null, error: json.error, loading: false });
      } else {
        setState({ data: json.data ?? null, error: null, loading: false });
      }
    } catch (e) {
      setState({
        data: null,
        error: e instanceof Error ? e.message : "Something went wrong",
        loading: false,
      });
    }
  }, [url]);

  useEffect(() => {
    void execute();
  }, [execute]);

  const retry = useCallback(() => {
    void execute();
  }, [execute]);

  return { ...state, retry };
}
